import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-bold text-red-500">
                    Hapus Akun
                </h2>
                <p className="mt-1 text-sm text-brand-text-muted">
                    Setelah akun Anda dihapus, semua sumber daya dan datanya akan dihapus secara permanen. Silakan unduh data atau informasi apa pun yang ingin Anda simpan sebelum menghapus akun.
                </p>
            </header>

            <button
                onClick={confirmUserDeletion}
                className="bg-red-500/10 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/20 transition text-sm font-semibold flex items-center gap-2"
            >
                <Trash2 size={16} /> Hapus Akun
            </button>

            {confirmingUserDeletion && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-brand-secondary rounded-xl shadow-2xl border border-red-500/30 w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center">
                                <AlertCircle size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-brand-text">Hapus Akun?</h3>
                                <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
                            </div>
                        </div>

                        <p className="text-sm text-brand-text mb-4">
                            Apakah Anda yakin ingin menghapus akun Anda? Masukkan kata sandi Anda untuk mengonfirmasi bahwa Anda ingin menghapus akun secara permanen.
                        </p>

                        <form onSubmit={deleteUser}>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-red-500/60 transition mb-2"
                                placeholder="Masukkan Kata Sandi"
                                required
                            />
                            {errors.password && <p className="text-xs text-red-500 mb-2">{errors.password}</p>}

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium transition hover:bg-brand-muted/70"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing ? 'Menghapus...' : 'Hapus Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}