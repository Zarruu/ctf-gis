document.addEventListener('DOMContentLoaded', function() {
    
    // Fokuskan kursor ke input username saat halaman selesai dimuat
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.focus();
    }

    // (Opsional) Tambahkan validasi sederhana sebelum form dikirim
    const loginForm = document.forms['login'];
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            if (!username || !password) {
                // Cegah form dari pengiriman jika ada field yang kosong
                event.preventDefault(); 
                alert('Username dan Password tidak boleh kosong!');
            }
        });
    }
});