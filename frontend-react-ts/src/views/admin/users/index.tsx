import { FC } from "react";
import AdminLayout from '../../../components/layout/AdminLayout';
import { Link } from "react-router";
import { useUsers, User } from "../../../hooks/user/useUsers";
import { useUserDelete } from "../../../hooks/user/useUserDelete";
import { usePagination } from "../../../hooks/usePagination";
import { useQueryClient } from '@tanstack/react-query';
import { useConfirm } from "@/components/common/ConfirmProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Shield, User as UserIcon } from "lucide-react";

const UsersIndex: FC = () => {
  const { data: users, isLoading, isError, error } = useUsers('peserta');
  const { page, totalPages, totalItems, startIndex, endIndex, items, search, setSearch, goToPage } =
    usePagination<User>(users, {
      searchBy: (u, q) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.category_name || "").toLowerCase().includes(q) ||
        u.role.includes(q),
    });
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUserDelete();
  const confirm = useConfirm();

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({
      title: "Hapus user",
      description: `Yakin ingin menghapus "${name}"?`,
      confirmLabel: "Hapus",
      destructive: true,
    });
    if (!ok) return;

    mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast.success("User berhasil dihapus");
      },
      onError: () => toast.error("Gagal menghapus user"),
    });
  }

  return (
    <AdminLayout
      title="Kelola Peserta"
      description="Kelola akun peserta pada sistem CBT."
      actions={
        <Link to="/admin/users/create">
          <Button><Plus className="size-4" /> Tambah Peserta</Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari nama, username, email, atau role..."
              className="w-full sm:max-w-xs"
            />
            {search && (
              <p className="text-xs text-muted-foreground">
                {totalItems} hasil untuk "{search}"
              </p>
            )}
          </div>
          {isLoading && (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="p-6 text-sm text-destructive">Error: {error.message}</p>
          )}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                      {search ? `Tidak ada hasil untuk "${search}".` : "Belum ada pengguna."}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((user: User, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center text-muted-foreground">{startIndex + index}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'admin' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {user.role === 'admin' ? <Shield className="size-3" /> : <UserIcon className="size-3" />}
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.category_name ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          {user.category_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/admin/users/edit/${user.id}`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isPending}
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        <Trash2 className="size-3.5" /> Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && !isError && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={goToPage}
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default UsersIndex;