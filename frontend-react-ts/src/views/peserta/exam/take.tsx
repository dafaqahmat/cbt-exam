import { FC, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CurrentState,
  getCurrentState,
  startExam,
  submitSection,
  startSection,
  reportViolation,
} from "../../../hooks/peserta/useExamSession";
import { openExamStream } from "../../../services/examStream";
import { toast } from "sonner";
import { Question } from "../../../hooks/question/useAdminQuestions";
import { Section } from "../../../hooks/section/useSections";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { imageUrl } from "../../../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight, Send } from "lucide-react";

type Phase = 'loading' | 'questions' | 'break' | 'finished';

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const ExamTake: FC = () => {
  const { id } = useParams();
  const examId = Number(id);
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [phase, setPhase] = useState<Phase>('loading');
  const [section, setSection] = useState<Section | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [breakRemainingSeconds, setBreakRemainingSeconds] = useState(0);
  const [nextSection, setNextSection] = useState<Section | null>(null);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Menyiapkan ujian...');

  const phaseRef = useRef<Phase>('loading');
  const answersRef = useRef<Record<number, string>>({});
  const sectionIdRef = useRef<number>(0);
  const nextSectionRef = useRef<Section | null>(null);
  const submittingRef = useRef(false);
  const violationCooldownRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { nextSectionRef.current = nextSection; }, [nextSection]);

  const applyState = useCallback((state: CurrentState) => {
    if (state.phase === 'questions' && state.section) {
      setSection(state.section);
      sectionIdRef.current = state.section.id;
      setQuestions(state.questions ?? []);
      setAnswers({});
      setCurrentIndex(0);
      setRemainingSeconds(state.remaining_seconds ?? 0);
      setPhase('questions');
    } else if (state.phase === 'break') {
      if (!state.next_section) {
        setPhase('finished');
        navigate(`/peserta/exams/${examId}/result`);
        return;
      }
      setBreakRemainingSeconds(state.break_remaining_seconds ?? 0);
      setNextSection(state.next_section ?? null);
      setPhase('break');
    } else if (state.phase === 'finished') {
      setPhase('finished');
      navigate(`/peserta/exams/${examId}/result`);
    }
  }, [examId, navigate]);

  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatusMessage('Mengirim jawaban...');
    try {
      const answerList = Object.entries(answersRef.current).map(([qid, opt]) => ({
        question_id: Number(qid),
        selected_option: opt,
      }));
      const state = await submitSection(sectionIdRef.current, answerList);
      applyState(state);
    } catch {
      setStatusMessage('Gagal mengirim. Mencoba lagi...');
    } finally {
      submittingRef.current = false;
    }
  }, [applyState]);

  const doStartNextSection = useCallback(async () => {
    if (!nextSectionRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setStatusMessage('Memulai sesi berikutnya...');
    try {
      const state = await startSection(nextSectionRef.current.id);
      applyState(state);
    } catch {
      setStatusMessage('Gagal melanjutkan.');
    } finally {
      submittingRef.current = false;
    }
  }, [applyState]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const current = await getCurrentState(examId);
        if (!mounted) return;
        if (current.phase === 'not_started') {
          const started = await startExam(examId);
          if (mounted) applyState(started);
        } else {
          applyState(current);
        }
      } catch {
        if (mounted) {
          setStatusMessage('Gagal memuat ujian.');
          setPhase('loading');
        }
      }
    })();
    return () => { mounted = false; };
  }, [examId, applyState]);

  useEffect(() => {
    let handled = false;

    const handleOnce = (fn: () => void) => {
      if (handled) return;
      handled = true;
      fn();
    };

    const doFinalizeClosed = async () => {
      try {
        const state = await getCurrentState(examId);
        applyState(state);
      } catch {
        navigate(`/peserta/exams/${examId}/result`);
      }
    };

    const closeStream = openExamStream(
      examId,
      (event) => {
        if (event.status === 'closed') {
          handleOnce(() => {
            if (phaseRef.current === 'questions') {
              doSubmit().then(doFinalizeClosed);
            } else {
              doFinalizeClosed();
            }
          });
        } else if (event.status === 'draft') {
          handleOnce(() => {
            toast.info('Ujian telah dikembalikan ke Draft oleh pengawas. Progres Anda direset.');
            navigate('/peserta/exams');
          });
        }
      },
      () => {
        // stream terputus — abaikan, timer lokal tetap berjalan
      }
    );

    return () => closeStream();
  }, [examId, applyState, doSubmit, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (phaseRef.current === 'questions') {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            doSubmit();
            return 0;
          }
          return prev - 1;
        });
      } else if (phaseRef.current === 'break') {
        setBreakRemainingSeconds((prev) => {
          if (prev <= 1) {
            doStartNextSection();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [doSubmit, doStartNextSection]);

  const recordViolation = useCallback(() => {
    const now = Date.now();
    if (now - violationCooldownRef.current < 2000) return;
    violationCooldownRef.current = now;
    setShowViolationModal(true);
    reportViolation(examId).catch(() => { });
  }, [examId]);

  useEffect(() => {
    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
    };
    enterFullscreen();

    const handleContextMenu = (e: Event) => e.preventDefault();
    const handleClipboard = (e: Event) => { e.preventDefault(); recordViolation(); };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && ['c', 'v', 'u', 's', 'x', 'p'].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === 'ArrowLeft') ||
        (e.altKey && e.key === 'ArrowRight')
      ) {
        e.preventDefault();
        recordViolation();
      }
    };
    const handleVisibility = () => {
      if (document.hidden && phaseRef.current !== 'loading') {
        recordViolation();
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && phaseRef.current === 'questions') {
        recordViolation();
        enterFullscreen();
      }
    };
    const handleBlur = () => {
      if (phaseRef.current !== 'loading') recordViolation();
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phaseRef.current === 'questions' || phaseRef.current === 'break') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.history.pushState({ exam: true }, '');
    const handlePopState = () => {
      window.history.pushState({ exam: true }, '');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('cut', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('cut', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
    };
  }, [recordViolation]);

  const selectAnswer = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const askSubmit = () => {
    confirm({
      title: "Kumpulkan sesi ini?",
      description: "Pastikan semua jawaban sudah dipilih. Jawaban tidak bisa diubah setelah dikumpulkan.",
      confirmLabel: "Kumpulkan",
    }).then((ok) => {
      if (ok) doSubmit();
    });
  };

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentIndex];

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-gradient px-6 text-center" style={{ userSelect: 'none' }}>
        <div className="rounded-2xl bg-white/95 p-8 shadow-2xl">
          <Loader2 className="mx-auto mb-4 size-10 animate-spin text-indigo-600" />
          <p className="font-semibold text-foreground">{statusMessage}</p>
        </div>
      </div>
    );
  }

  if (phase === 'break') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: '#f8fafc', userSelect: 'none' }}>
        <Card className="w-full max-w-md p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold">Waktu Istirahat</h2>
          <p className="mt-2 text-muted-foreground">
            Sesi berikutnya: <strong className="text-foreground">{nextSection?.title}</strong>
          </p>
          <p className="mt-6 text-5xl font-extrabold tabular-nums text-primary">
            {formatTime(breakRemainingSeconds)}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Halaman akan otomatis melanjutkan saat waktu istirahat habis. Tetap di halaman ini.
          </p>
          <Button
            className="mt-6 w-full"
            disabled={breakRemainingSeconds > 0}
            onClick={doStartNextSection}
          >
            {breakRemainingSeconds > 0 ? 'Menunggu...' : 'Lanjut ke Sesi Berikutnya'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc', userSelect: 'none' }}>
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md" style={{ backgroundColor: '#0f172a' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="text-white">
            <strong className="text-sm sm:text-base">{section?.title}</strong>
            <span className="ml-3 text-xs text-slate-400">
              Terjawab: {answeredCount}/{questions.length}
            </span>
          </div>
          <div className={`text-xl font-bold tabular-nums sm:text-2xl ${remainingSeconds <= 60 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(remainingSeconds)}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <p className="mb-4 text-sm text-muted-foreground">
                  Soal {currentIndex + 1} dari {questions.length}
                </p>

                {currentQuestion?.question_text && (
                  <p className="text-lg font-medium leading-relaxed">{currentQuestion.question_text}</p>
                )}
                {currentQuestion?.question_image && (
                  <img
                    src={imageUrl(currentQuestion.question_image)}
                    alt="soal"
                    className="mt-3 max-h-72 rounded-lg border object-contain"
                  />
                )}

                <div className="mt-5 space-y-2.5">
                  {currentQuestion && (['a', 'b', 'c', 'd'] as const).map((opt) => {
                    const text = currentQuestion[`option_${opt}_text` as keyof Question] as string;
                    const img = currentQuestion[`option_${opt}_image` as keyof Question] as string;
                    const isSelected = answers[currentQuestion.id] === opt.toUpperCase();
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => selectAnswer(currentQuestion.id, opt.toUpperCase())}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted'}`}
                      >
                        <span
                          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                        >
                          {opt.toUpperCase()}
                        </span>
                        <span className="flex-1">
                          {text && <span className="text-sm">{text}</span>}
                          {img && (
                            <img src={imageUrl(img)} alt={`opsi ${opt}`} className="mt-2 max-h-40 rounded border object-contain" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="size-4" /> Sebelumnya
                  </Button>
                  {currentIndex < questions.length - 1 ? (
<Button
                        onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                      >
                        Berikutnya <ChevronRight className="size-4" />
                      </Button>
                    ) : (
                      <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={askSubmit}>
                        <Send className="size-4" /> Kumpulkan Sesi Ini
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 shadow-sm">
              <CardContent className="p-5">
                <h3 className="mb-3 text-sm font-semibold">Navigasi Soal</h3>
                <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-colors ${answers[q.id] ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} ${i === currentIndex ? 'ring-2 ring-ring' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <span>Terjawab: <strong className="text-foreground">{answeredCount}</strong></span>
                  <span>Total: <strong className="text-foreground">{questions.length}</strong></span>
                </div>
                <Button className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={askSubmit}>
                  <Send className="size-4" /> Kumpulkan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showViolationModal} onOpenChange={(open) => { if (!open) { setShowViolationModal(false); document.documentElement.requestFullscreen().catch(() => { }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle>Peringatan Pelanggaran</DialogTitle>
            <DialogDescription>
              Anda terdeteksi keluar dari mode ujian (pindah tab, keluar fullscreen, atau mencoba shortcut terlarang).
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-semibold text-destructive">
            Pelanggaran ini telah dicatat dan dilaporkan ke pengawas. Ulangi pelanggaran dapat menyebabkan diskualifikasi.
          </p>
          <Button
            className="w-full"
            variant="destructive"
            onClick={() => {
              setShowViolationModal(false);
              document.documentElement.requestFullscreen().catch(() => { });
            }}
          >
            Kembali ke Ujian
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ExamTake;