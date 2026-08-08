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
import { Question } from "../../../hooks/question/useAdminQuestions";
import { Section } from "../../../hooks/section/useSections";
import { imageUrl } from "../../../services/api";

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

    const answeredCount = Object.keys(answers).length;
    const currentQuestion = questions[currentIndex];

    if (phase === 'loading') {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <p className="fw-bold">{statusMessage}</p>
                </div>
            </div>
        );
    }

    if (phase === 'break') {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', userSelect: 'none' }}>
                <div className="card border-0 rounded-4 shadow-sm p-5 text-center" style={{ maxWidth: '500px' }}>
                    <h3 className="fw-bold mb-3">Waktu Istirahat</h3>
                    <p className="text-muted">Sesi berikutnya: <strong>{nextSection?.title}</strong></p>
                    <h1 className="display-3 fw-bold text-primary">{formatTime(breakRemainingSeconds)}</h1>
                    <p className="text-muted mt-3">Halaman akan otomatis melanjutkan saat waktu istirahat habis. Tetap di halaman ini.</p>
                    <button onClick={doStartNextSection} disabled={breakRemainingSeconds > 0} className="btn btn-primary rounded-4 mt-3">
                        {breakRemainingSeconds > 0 ? 'Menunggu...' : 'LANJUT KE SESI BERIKUTNYA'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', userSelect: 'none' }}>
            <div className="bg-dark text-white p-3 d-flex justify-content-between align-items-center">
                <div>
                    <strong>{section?.title}</strong>
                    <span className="ms-3 text-muted small">Terjawab: {answeredCount}/{questions.length}</span>
                </div>
                <div className={`fw-bold fs-4 ${remainingSeconds <= 60 ? 'text-danger' : ''}`}>
                    {formatTime(remainingSeconds)}
                </div>
            </div>

            <div className="container mt-4">
                <div className="row">
                    <div className="col-md-8">
                        <div className="card border-0 rounded-4 shadow-sm">
                            <div className="card-body">
                                <h6 className="text-muted mb-3">Soal {currentIndex + 1} dari {questions.length}</h6>

                                {currentQuestion?.question_text && (
                                    <p className="fs-5">{currentQuestion.question_text}</p>
                                )}
                                {currentQuestion?.question_image && (
                                    <img src={imageUrl(currentQuestion.question_image)} alt="soal" className="img-fluid rounded mb-3" style={{ maxWidth: '400px' }} />
                                )}

                                <hr />

                                {currentQuestion && (['a', 'b', 'c', 'd'] as const).map((opt) => {
                                    const text = currentQuestion[`option_${opt}_text` as keyof Question] as string;
                                    const img = currentQuestion[`option_${opt}_image` as keyof Question] as string;
                                    const isSelected = answers[currentQuestion.id] === opt.toUpperCase();
                                    return (
                                        <div
                                            key={opt}
                                            onClick={() => selectAnswer(currentQuestion.id, opt.toUpperCase())}
                                            className={`border rounded p-3 mb-2 d-flex align-items-center ${isSelected ? 'border-primary bg-primary-subtle' : ''}`}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <input type="radio" readOnly checked={isSelected} className="me-3" />
                                            <div>
                                                <strong className="me-2">{opt.toUpperCase()}.</strong>
                                                {text && <span>{text}</span>}
                                                {img && <img src={imageUrl(img)} alt={`opsi ${opt}`} className="img-fluid d-block mt-2" style={{ maxWidth: '200px' }} />}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="d-flex justify-content-between mt-4">
                                    <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="btn btn-secondary rounded-4">
                                        SEBELUMNYA
                                    </button>
                                    {currentIndex < questions.length - 1 ? (
                                        <button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))} className="btn btn-primary rounded-4">
                                            BERIKUTNYA
                                        </button>
                                    ) : (
                                        <button onClick={() => { if (confirm('Kumpulkan jawaban sesi ini sekarang?')) doSubmit(); }} className="btn btn-success rounded-4">
                                            KUMPULKAN SESI INI
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 rounded-4 shadow-sm">
                            <div className="card-header">Navigasi Soal</div>
                            <div className="card-body">
                                <div className="d-flex flex-wrap gap-2">
                                    {questions.map((q, i) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentIndex(i)}
                                            className={`btn btn-sm ${answers[q.id] ? 'btn-success' : 'btn-outline-secondary'} ${i === currentIndex ? 'border border-dark border-2' : ''}`}
                                            style={{ width: '40px' }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <hr />
                                <button onClick={() => { if (confirm('Kumpulkan jawaban sesi ini sekarang?')) doSubmit(); }} className="btn btn-success w-100 rounded-4">
                                    KUMPULKAN SESI INI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showViolationModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-danger">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">PERINGATAN PELANGGARAN</h5>
                            </div>
                            <div className="modal-body">
                                <p>Anda terdeteksi keluar dari mode ujian (pindah tab, keluar fullscreen, atau mencoba shortcut terlarang).</p>
                                <p className="fw-bold text-danger">Pelanggaran ini telah dicatat dan dilaporkan ke pengawas. Ulangi pelanggaran dapat menyebabkan diskualifikasi.</p>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => { setShowViolationModal(false); document.documentElement.requestFullscreen().catch(() => { }); }} className="btn btn-danger rounded-4">
                                    KEMBALI KE UJIAN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ExamTake;
