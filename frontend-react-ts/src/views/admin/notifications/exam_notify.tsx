import { FC, useState, type FormEvent } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link, useParams } from "react-router";
import { useNotifyPreview, useSendExamNotification } from "../../../hooks/notification/useExamNotification";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Send, Loader2, ArrowLeft, Info } from "lucide-react";

const ExamNotify: FC = () => {
  const { id } = useParams();
  const examId = Number(id);

  const { data: preview, isLoading, isError, error } = useNotifyPreview(examId);
  const { mutate: send, isPending } = useSendExamNotification();
  const confirm = useConfirm();

  const [message, setMessage] = useState<string>("");
  const [examDate, setExamDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setErrors({ Message: "Isi pesan pemberitahuan terlebih dahulu" });
      return;
    }
    setErrors({});

    const ok = await confirm({
      title: "Kirim pemberitahuan?",
      description: `Email akan dikirim ke ${preview?.recipient_count ?? 0} peserta. Sistem akan membuat password baru otomatis untuk setiap peserta dan mencantumkannya di email.`,
      confirmLabel: "Kirim",
    });
    if (!ok) return;

    send({ examId, data: { message: message.trim(), exam_date: examDate, start_time: startTime, end_time: endTime } }, {
      onSuccess: (result) => {
        if (result.failed === 0) {
          toast.success(`Pemberitahuan terkirim ke ${result.sent} dari ${result.total_recipients} peserta`);
        } else {
          toast.warning(
            `Terkirim ${result.sent} dari ${result.total_recipients} peserta (${result.failed} gagal)${result.error ? `: ${result.error}` : ""}`,
            { duration: 6000 }
          );
        }
      },
      onError: (err) => {
        setErrors({ Message: err.message });
        toast.error(err.message || "Gagal mengirim pemberitahuan");
      },
    });
  };

  return (
    <AdminLayout
      title="Kirim Pemberitahuan"
      description="Kirim pesan via email ke Gmail peserta sesuai kategori ujian."
      actions={
        <Link to="/admin/exams">
          <Button variant="outline"><ArrowLeft className="size-4" /> Kembali</Button>
        </Link>
      }
    >
      <Card className="mb-5">
        <CardContent className="p-5">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">Error: {error.message}</p>
          )}
          {!isLoading && !isError && preview && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{preview.exam_title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {(preview.categories ?? []).map((cat) => (
                    <span key={cat.id} className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
                <Mail className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-xl font-bold">{preview.recipient_count}</p>
                  <p className="text-xs text-muted-foreground">Penerima email</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Isi Pemberitahuan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Email menyapa peserta berdasarkan nama, subjek otomatis "Pemberitahuan Ujian: {preview?.exam_title ?? '...'}".
                Sistem membuat <strong className="text-foreground">password baru otomatis</strong> untuk setiap penerima dan
                mencantumkan username + password beserta jadwal yang Anda isi di bawah ini.
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="exam-date">Tanggal Ujian</Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start-time">Waktu Mulai</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time">Waktu Selesai</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Isi Pesan</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contoh: Ujian Matematika akan dimulai besok. Pastikan Anda sudah siap dan mengakses menu Ujian."
                rows={6}
              />
              {errors.Message && <p className="text-xs text-destructive">{errors.Message}</p>}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={isPending || (preview?.recipient_count ?? 0) === 0}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {isPending ? 'Mengirim...' : 'Kirim Notifikasi'}
              </Button>
              <Link to="/admin/exams">
                <Button type="button" variant="outline">Batal</Button>
              </Link>
            </div>

            {!isLoading && !isError && (preview?.recipient_count ?? 0) === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Tidak ada peserta dengan email terdaftar pada kategori ujian ini. Email tidak dapat dikirim.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default ExamNotify;