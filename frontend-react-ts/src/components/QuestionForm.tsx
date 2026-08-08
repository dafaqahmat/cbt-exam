import { FC, useState, type FormEvent, type ReactNode } from "react";
import { QuestionRequest } from "../hooks/question/useQuestionCreate";
import { useUploadImage } from "../hooks/upload/useUploadImage";
import { imageUrl } from "../services/api";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, ImageIcon } from "lucide-react";

interface QuestionFormProps {
  initial: QuestionRequest;
  errors: Record<string, string>;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (data: QuestionRequest) => void;
}

const TYPES = [
  { value: "text_text", label: "Teks → Teks" },
  { value: "text_image", label: "Teks → Gambar" },
  { value: "image_text", label: "Gambar → Teks" },
  { value: "image_image", label: "Gambar → Gambar" },
];

const OPTION_KEYS = ["a", "b", "c", "d"] as const;
type OptionKey = (typeof OPTION_KEYS)[number];
type QuestionField = keyof QuestionRequest;

const QuestionForm: FC<QuestionFormProps> = ({ initial, errors, submitLabel, isPending, onSubmit }) => {
  const [form, setForm] = useState<QuestionRequest>(initial);
  const { mutateAsync: uploadImage, isPending: uploading } = useUploadImage();

  const setField = (field: QuestionField, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (field: QuestionField, file?: File) => {
    if (!file) return;
    try {
      const result = await uploadImage(file);
      setField(field, result.data.url);
      toast.success("Gambar berhasil diunggah");
    } catch {
      toast.error("Gagal mengunggah gambar");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const Field: FC<{ label: string; error?: string; children: ReactNode; className?: string }> = ({
    label,
    error,
    children,
    className,
  }) => (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  const ImageUploader: FC<{ value: string; onUpload: (file?: File) => void; disabled?: boolean }> = ({
    value,
    onUpload,
    disabled,
  }) => (
    <div className="flex items-center gap-3">
      <Label
        role="button"
        tabIndex={0}
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Upload className="size-4" />
        {disabled ? "Mengunggah..." : "Pilih gambar"}
        <Input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
      </Label>
      {value && (
        <div className="flex items-center gap-2">
          <img
            src={imageUrl(value)}
            alt="pratinjau"
            className="h-16 w-16 rounded-lg border object-cover"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => onUpload(undefined)}>
            Hapus
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenis Soal" error={errors.Type}>
          <Select value={form.type} onValueChange={(v) => v != null && setField("type", v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih jenis soal" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Poin" error={errors.Points}>
          <Input
            type="number"
            min={1}
            value={form.points}
            onChange={(e) => setField("points", Number(e.target.value))}
          />
        </Field>

        <Field label="Soal (Teks)" className="sm:col-span-2" error={errors.QuestionText}>
          <Textarea
            value={form.question_text}
            onChange={(e) => setField("question_text", e.target.value)}
            placeholder="Tuliskan pertanyaan..."
          />
        </Field>

        <Field label="Gambar Soal" className="sm:col-span-2" error={errors.QuestionImage}>
          <ImageUploader value={form.question_image} onUpload={(f) => handleImageUpload("question_image", f)} disabled={uploading} />
        </Field>

        <Field label="Kunci Jawaban" className="sm:col-span-2" error={errors.CorrectAnswer}>
          <Select value={form.correct_answer} onValueChange={(v) => v != null && setField("correct_answer", v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih kunci jawaban" />
            </SelectTrigger>
            <SelectContent>
              {OPTION_KEYS.map((k) => (
                <SelectItem key={k} value={k.toUpperCase()}>
                  {k.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ImageIcon className="size-4" />
          Opsi Jawaban (A – D)
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {OPTION_KEYS.map((key: OptionKey) => (
            <div key={key} className="space-y-2 rounded-lg border bg-background p-3">
              <Field label={`Opsi ${key.toUpperCase()} — Teks`}>
                <Input
                  value={String(form[`option_${key}_text`])}
                  onChange={(e) => setField(`option_${key}_text`, e.target.value)}
                />
              </Field>
              <Field label={`Opsi ${key.toUpperCase()} — Gambar`}>
                <ImageUploader
                  value={String(form[`option_${key}_image`])}
                  onUpload={(f) => handleImageUpload(`option_${key}_image` as QuestionField, f)}
                  disabled={uploading}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isPending || uploading}>
        {isPending ? "Menyimpan..." : submitLabel}
      </Button>
    </form>
  );
};

export default QuestionForm;