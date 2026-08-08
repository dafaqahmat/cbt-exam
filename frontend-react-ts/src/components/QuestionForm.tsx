import { FC, useState, FormEvent, ChangeEvent } from "react";
import { QuestionRequest } from "../hooks/question/useQuestionCreate";
import { useUploadImage } from "../hooks/upload/useUploadImage";
import { imageUrl } from "../services/api";

interface ValidationErrors {
    [key: string]: string;
}

interface QuestionFormProps {
    initial: QuestionRequest;
    errors: ValidationErrors;
    submitLabel: string;
    isPending: boolean;
    onSubmit: (data: QuestionRequest) => void;
}

const OPTIONS = ['a', 'b', 'c', 'd'] as const;

const QuestionForm: FC<QuestionFormProps> = ({ initial, errors, submitLabel, isPending, onSubmit }) => {
    const [form, setForm] = useState<QuestionRequest>(initial);
    const { mutate: uploadImage, isPending: uploading } = useUploadImage();

    const questionUsesImage = form.type === 'image_text' || form.type === 'image_image';
    const optionsUseImage = form.type === 'text_image' || form.type === 'image_image';

    const setField = (field: keyof QuestionRequest, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleTypeChange = (type: string) => {
        setForm((prev) => ({ ...prev, type }));
    };

    const handleImageUpload = (field: keyof QuestionRequest, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadImage(file, {
            onSuccess: (data) => {
                setField(field, data.data.url);
            }
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    const ImageField: FC<{ field: keyof QuestionRequest, label: string, current: string }> = ({ field, label, current }) => (
        <div className="form-group mb-3">
            <label className="mb-1 fw-bold">{label}</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(field, e)} className="form-control" />
            {uploading && <div className="text-muted small mt-1">Mengunggah...</div>}
            {current && (
                <img src={imageUrl(current)} alt={label} className="img-thumbnail mt-2" style={{ maxWidth: '150px' }} />
            )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
                <label className="mb-1 fw-bold">Tipe Soal</label>
                <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)} className="form-control">
                    <option value="text_text">Teks -&gt; Teks (soal teks, opsi teks)</option>
                    <option value="text_image">Teks -&gt; Gambar (soal teks, opsi gambar)</option>
                    <option value="image_text">Gambar -&gt; Teks (soal gambar, opsi teks)</option>
                    <option value="image_image">Gambar -&gt; Gambar (soal gambar, opsi gambar)</option>
                </select>
                {errors.Type && <div className="alert alert-danger mt-2 rounded-4">{errors.Type}</div>}
            </div>

            {questionUsesImage ? (
                <ImageField field="question_image" label="Gambar Soal" current={form.question_image} />
            ) : (
                <div className="form-group mb-3">
                    <label className="mb-1 fw-bold">Teks Soal</label>
                    <textarea value={form.question_text} onChange={(e) => setField('question_text', e.target.value)} className="form-control" rows={3} placeholder="Tulis soal di sini"></textarea>
                    {errors.QuestionText && <div className="alert alert-danger mt-2 rounded-4">{errors.QuestionText}</div>}
                </div>
            )}

            <hr />
            <h6 className="fw-bold">Pilihan Jawaban</h6>

            {OPTIONS.map((opt) => {
                const textField = `option_${opt}_text` as keyof QuestionRequest;
                const imageField = `option_${opt}_image` as keyof QuestionRequest;
                return (
                    <div key={opt} className="form-group mb-3 p-3 border rounded">
                        <label className="mb-1 fw-bold">Opsi {opt.toUpperCase()}</label>
                        {optionsUseImage ? (
                            <ImageField field={imageField} label={`Gambar Opsi ${opt.toUpperCase()}`} current={form[imageField] as string} />
                        ) : (
                            <input type="text" value={form[textField] as string} onChange={(e) => setField(textField, e.target.value)} className="form-control" placeholder={`Opsi ${opt.toUpperCase()}`} />
                        )}
                    </div>
                );
            })}

            <div className="row">
                <div className="col-md-6">
                    <div className="form-group mb-3">
                        <label className="mb-1 fw-bold">Kunci Jawaban</label>
                        <select value={form.correct_answer} onChange={(e) => setField('correct_answer', e.target.value)} className="form-control">
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                        </select>
                        {errors.CorrectAnswer && <div className="alert alert-danger mt-2 rounded-4">{errors.CorrectAnswer}</div>}
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group mb-3">
                        <label className="mb-1 fw-bold">Poin</label>
                        <input type="number" min={1} value={form.points} onChange={(e) => setField('points', Number(e.target.value))} className="form-control" />
                    </div>
                </div>
            </div>

            <button type="submit" className="btn btn-primary rounded-4 shadow-sm border-0" disabled={isPending || uploading}>
                {(isPending || uploading) ? 'Loading...' : submitLabel}
            </button>
        </form>
    );
};

export default QuestionForm;
