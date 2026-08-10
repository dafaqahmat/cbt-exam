import { FC, useState } from "react";
import AdminLayout from "../../../components/layout/AdminLayout";
import { useReport, ReportFilters, ReportExamItem } from "../../../hooks/report/useReport";
import { useAdminExams } from "../../../hooks/exam/useAdminExams";
import { useCategories } from "../../../hooks/category/useCategories";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, FilterX, Search } from "lucide-react";

const EMPTY_FILTERS: ReportFilters = {
  start: "",
  end: "",
  exam_id: "0",
  category_id: "0",
};

const fmtScore = (value: number | null): string => {
  if (value === null) return "-";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

const ReportIndex: FC = () => {
  const { data: exams, isLoading: examsLoading } = useAdminExams();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const [draft, setDraft] = useState<ReportFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [filtersActive, setFiltersActive] = useState(false);

  const { data, isLoading, isError, error } = useReport({
    start: filters.start,
    end: filters.end,
    exam_id: filters.exam_id === "0" ? "" : filters.exam_id,
    category_id: filters.category_id === "0" ? "" : filters.category_id,
  }, true);

  const setField = (field: keyof ReportFilters, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setFiltersActive(true);
    setFilters({
      start: draft.start,
      end: draft.end,
      exam_id: draft.exam_id || "0",
      category_id: draft.category_id || "0",
    });
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFiltersActive(false);
  };

  const hasActiveFilter = filtersActive && (filters.start || filters.end || filters.exam_id !== "0" || filters.category_id !== "0");

  const selectedExam = exams?.find((exam) => String(exam.id) === filters.exam_id);
  const selectedCategory = categories?.find((category) => String(category.id) === filters.category_id);

  return (
    <AdminLayout
      title="Report Ujian"
      description="Rekap hasil ujian berdasarkan periode tanggal, jenis ujian, dan kategori kelas."
    >
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="text-base">Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-start">Tanggal Awal</Label>
              <Input
                id="report-start"
                type="date"
                value={draft.start}
                onChange={(e) => setField("start", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-end">Tanggal Akhir</Label>
              <Input
                id="report-end"
                type="date"
                value={draft.end}
                onChange={(e) => setField("end", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Ujian</Label>
              <Select
                value={draft.exam_id}
                onValueChange={(v) => v != null && setField("exam_id", v)}
                items={Object.fromEntries((exams ?? []).map((exam) => [String(exam.id), exam.title]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua ujian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Semua Ujian</SelectItem>
                  {exams?.map((exam) => (
                    <SelectItem key={exam.id} value={String(exam.id)}>{exam.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kategori Kelas</Label>
              <Select
                value={draft.category_id}
                onValueChange={(v) => v != null && setField("category_id", v)}
                items={Object.fromEntries((categories ?? []).map((cat) => [String(cat.id), cat.name]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Semua Kategori</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={applyFilters} disabled={isLoading}>
              <Search className="size-4" /> Terapkan Filter
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <FilterX className="size-4" /> Reset
            </Button>
          </div>

          {hasActiveFilter && (
            <p className="mt-3 text-xs text-muted-foreground">
              Periode: {filters.start ? new Date(filters.start + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "awal"}
              {" s.d. "}
              {filters.end ? new Date(filters.end + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "akhir"}
              {selectedExam ? ` | Ujian: ${selectedExam.title}` : " | Ujian: Semua"}
              {selectedCategory ? ` | Kelas: ${selectedCategory.name}` : " | Kelas: Semua"}
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">Error: {error.message}</CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              Rekap Ujian
              <span className="text-xs font-normal text-muted-foreground">
                ({data?.total_exams ?? 0} ujian, {data?.total_participants ?? 0} peserta)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Ujian</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Peserta</TableHead>
                  <TableHead className="text-center">Selesai</TableHead>
                  <TableHead className="text-center">Rata-rata</TableHead>
                  <TableHead className="text-center">Tertinggi</TableHead>
                  <TableHead className="text-center">Terendah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.exams ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                      Tidak ada data sesuai filter.
                    </TableCell>
                  </TableRow>
                )}
                {(data?.exams ?? []).map((item: ReportExamItem, index: number) => (
                  <TableRow key={item.exam_id}>
                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.exam_title}</TableCell>
                    <TableCell><StatusBadge status={item.exam_status} /></TableCell>
                    <TableCell className="text-center">{item.participant_count}</TableCell>
                    <TableCell className="text-center">{item.finished_count}</TableCell>
                    <TableCell className="text-center font-semibold">{fmtScore(item.average_score)}</TableCell>
                    <TableCell className="text-center">{fmtScore(item.max_score)}</TableCell>
                    <TableCell className="text-center">{fmtScore(item.min_score)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(examsLoading || categoriesLoading) && (
        <p className="mt-2 text-xs text-muted-foreground">Memuat pilihan filter...</p>
      )}
    </AdminLayout>
  );
};

export default ReportIndex;