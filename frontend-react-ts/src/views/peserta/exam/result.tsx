import { FC } from "react";
import { Link, useParams } from "react-router";
import { usePesertaResult } from "../../../hooks/peserta/usePesertaResult";
import { SectionScore } from "../../../hooks/result/useAdminResults";
import { usePagination } from "../../../hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import { AlertTriangle, ArrowLeft, Trophy } from "lucide-react";

const ExamResult: FC = () => {
  const { id } = useParams();
  const examId = Number(id);

  const { data, isLoading, isError, error } = usePesertaResult(examId);
  const { page, totalPages, totalItems, startIndex, endIndex, items, search, setSearch, goToPage } =
    usePagination<SectionScore>(data?.sections, {
      searchBy: (s, q) => s.title.toLowerCase().includes(q),
    });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Hasil Ujian</h1>
        <Link to="/peserta/exams">
          <Button variant="outline"><ArrowLeft className="size-4" /> Kembali</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">Error: {error.message}</CardContent>
        </Card>
      )}

      {data && !data.published && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Nilai Belum Diumumkan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Anda telah menyelesaikan ujian. Nilai akan ditampilkan setelah admin mempublikasikannya. Cek kembali halaman ini nanti.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.published && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg shadow-indigo-500/30">
                <Trophy className="size-7" />
              </div>
              <p className="text-sm text-muted-foreground">Nilai Total Anda</p>
              <p className="bg-brand-gradient bg-clip-text text-6xl font-extrabold tracking-tight text-transparent">
                {data.total_score ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Jumlah pelanggaran selama ujian:{" "}
                <span className={data.violation_count && data.violation_count > 0 ? 'font-semibold text-destructive' : 'font-semibold text-foreground'}>
                  {data.violation_count ?? 0}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nilai Per Sesi</CardTitle>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Cari sesi..."
                className="w-full sm:max-w-xs"
              />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">No</TableHead>
                    <TableHead>Sesi</TableHead>
                    <TableHead className="text-center">Nilai</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                        {search ? `Tidak ada hasil untuk "${search}".` : "Belum ada data sesi."}
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((s: SectionScore, index) => (
                    <TableRow key={s.section_id}>
                      <TableCell className="text-center font-medium text-muted-foreground">{startIndex + index}</TableCell>
                      <TableCell className="font-medium">{s.title}</TableCell>
                      <TableCell className="text-center font-bold">{s.score ?? '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.status === 'finished' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'}`}>
                          {s.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={goToPage}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ExamResult;