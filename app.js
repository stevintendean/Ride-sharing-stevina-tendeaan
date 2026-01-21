let web3;
let contract;
let account;

const contractAddress = "0x3f0d70ebc91eaea590d18e4a8dc258993581edec"; 
const contractABI = [
    { "inputs": [ { "internalType": "uint256", "name": "_rideId", "type": "uint256" } ], "name": "acceptRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "_rideId", "type": "uint256" } ], "name": "cancelRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "_rideId", "type": "uint256" } ], "name": "completeRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "_rideId", "type": "uint256" } ], "name": "confirmArrival", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "address", "name": "driver", "type": "address" }, { "indexed": false, "internalType": "string", "name": "name", "type": "string" } ], "name": "DriverRegistered", "type": "event" },
    { "inputs": [ { "internalType": "uint256", "name": "_rideId", "type": "uint256" } ], "name": "fundRide", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [ { "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "uint256", "name": "_tariff", "type": "uint256" } ], "name": "registerDriver", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "requestRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "rideId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "driver", "type": "address" } ], "name": "RideAccepted", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "rideId", "type": "uint256" } ], "name": "RideCancelled", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "rideId", "type": "uint256" } ], "name": "RideCompleted", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "rideId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amountTransferred", "type": "uint256" } ], "name": "RideFinalized", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "rideId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "RideFunded", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "rideId", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "passenger", "type": "address" } ], "name": "RideRequested", "type": "event" },
    { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "driverList", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "drivers", "outputs": [ { "internalType": "address", "name": "walletAddress", "type": "address" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "uint256", "name": "tariff", "type": "uint256" }, { "internalType": "bool", "name": "isRegistered", "type": "bool" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "getAllDrivers", "outputs": [ { "internalType": "address[]", "name": "", "type": "address[]" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "_driverAddress", "type": "address" } ], "name": "getDriver", "outputs": [ { "components": [ { "internalType": "address", "name": "walletAddress", "type": "address" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "uint256", "name": "tariff", "type": "uint256" }, { "internalType": "bool", "name": "isRegistered", "type": "bool" } ], "internalType": "struct RideSharing.Driver", "name": "", "type": "tuple" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "rideCounter", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "rides", "outputs": [ { "internalType": "uint256", "name": "rideId", "type": "uint256" }, { "internalType": "address", "name": "passenger", "type": "address" }, { "internalType": "address", "name": "driver", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint8", "name": "status", "type": "uint8" }, { "internalType": "bool", "name": "exists", "type": "bool" } ], "stateMutability": "view", "type": "function" }
];

// --- HELPER ALERT (SWEETALERT2) ---
function showAlert(title, message, type = 'success') {
    Swal.fire({
        title: title,
        text: message,
        icon: type,
        confirmButtonColor: '#00AA13',
        confirmButtonText: 'Oke, Siap!'
    });
}

function showLoading() {
    Swal.fire({
        title: 'Memproses Transaksi...',
        html: 'Mohon tunggu, jangan tutup browser.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
    });
}

// --- LOGIKA WEB3 ---

async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            account = accounts[0];
            
            // Update UI Keren
            document.getElementById('myAccount').innerText = account.substring(0,6) + "..." + account.substring(38);
            document.getElementById('btnText').innerText = "Terhubung";
            
            const statusEl = document.getElementById('connectionStatus');
            statusEl.innerText = "Online (Sepolia)";
            statusEl.className = "badge badge-online";

            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Notifikasi Toast Kecil di pojok
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
            });
            Toast.fire({ icon: 'success', title: 'Wallet Terhubung!' });

        } catch (error) {
            console.error(error);
            showAlert('Oops!', 'Koneksi ditolak oleh user.', 'error');
        }
    } else {
        showAlert('MetaMask Missing', 'Harap install MetaMask extension!', 'warning');
    }
}

// --- FUNGSI TRANSAKSI ---

async function registerDriver() {
    const name = document.getElementById('driverName').value;
    const tariffEth = document.getElementById('driverTariff').value;
    
    if(!name || !tariffEth) return showAlert('Data Kurang', 'Isi nama dan tarif dulu ya!', 'warning');
    
    const tariffWei = web3.utils.toWei(tariffEth, "ether");
    
    try {
        showLoading();
        await contract.methods.registerDriver(name, tariffWei).send({ from: account });
        showAlert('Berhasil!', `Selamat bergabung, ${name}!`);
    } catch (err) {
        Swal.close(); // Tutup loading
        showAlert('Gagal', err.message, 'error');
    }
}

async function requestRide() {
    try {
        showLoading();
        await contract.methods.requestRide().send({ from: account });
        showAlert('Pesanan Dibuat!', 'Silakan cek ID pesanan Anda di panel bawah.');
    } catch (err) {
        Swal.close();
        showAlert('Gagal', err.message, 'error');
    }
}

async function acceptRide() {
    const id = document.getElementById('driverRideId').value;
    if(!id) return showAlert('ID Kosong', 'Masukkan ID pesanan yang mau diambil.', 'warning');

    try {
        showLoading();
        await contract.methods.acceptRide(id).send({ from: account });
        showAlert('Pesanan Diterima!', 'Segera jemput penumpang Anda.');
    } catch (err) {
        Swal.close();
        showAlert('Gagal', err.message, 'error');
    }
}

async function fundRide() {
    const id = document.getElementById('passRideId').value;
    const amountEth = document.getElementById('passAmount').value;
    
    if(!amountEth || !id) return showAlert('Data Kurang', 'Isi ID dan Jumlah Pembayaran.', 'warning');
    const amountWei = web3.utils.toWei(amountEth, "ether");

    try {
        showLoading();
        await contract.methods.fundRide(id).send({ from: account, value: amountWei });
        showAlert('Pembayaran Aman!', 'Dana dikunci di Smart Contract (Escrow).');
    } catch (err) {
        Swal.close();
        showAlert('Gagal', 'Pastikan saldo cukup & jumlah pas sesuai tarif driver.', 'error');
    }
}

async function completeRide() {
    const id = document.getElementById('driverRideId').value;
    try {
        showLoading();
        await contract.methods.completeRide(id).send({ from: account });
        showAlert('Perjalanan Selesai!', 'Menunggu konfirmasi penumpang.');
    } catch (err) {
        Swal.close();
        showAlert('Gagal', err.message, 'error');
    }
}

async function confirmArrival() {
    const id = document.getElementById('passRideId').value;
    try {
        showLoading();
        await contract.methods.confirmArrival(id).send({ from: account });
        showAlert('Transaksi Tuntas!', 'Dana telah diteruskan ke Driver. Terima kasih!');
    } catch (err) {
        Swal.close();
        showAlert('Gagal', err.message, 'error');
    }
}

// --- FUNGSI BACA DATA ---

async function cekStatusPesanan() {
    const id = document.getElementById('checkId').value;
    if(!id) return;
    
    const output = document.getElementById('outputArea');
    output.innerHTML = '<p>Sedang mencari data...</p>';

    try {
        const ride = await contract.methods.rides(id).call();
        const statusText = ["Requested 🕒", "Accepted 🚕", "Funded 💰", "Completed 🏁", "Finalized ✅", "Cancelled ❌"];
        
        if (!ride.exists) {
             output.innerHTML = '<p style="color: #e74c3c;">ID Pesanan tidak ditemukan.</p>';
             return;
        }

        const info = `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 10px;">
            <strong>RIDE ID: #${id}</strong>
            <span style="color: #ffeaa7;">${statusText[ride.status]}</span>
        </div>
        <div>Passenger: ${ride.passenger.substring(0,10)}...</div>
        <div>Driver: ${ride.driver == "0x0000000000000000000000000000000000000000" ? "Belum ada" : ride.driver.substring(0,10)+"..."}</div>
        <div style="margin-top: 10px; font-weight: bold; color: #55efc4;">Harga: ${web3.utils.fromWei(ride.amount, 'ether')} ETH</div>
        `;
        output.innerHTML = info;
    } catch (e) {
        console.error(e);
        output.innerHTML = '<p style="color: red;">Error mengambil data.</p>';
    }
}

async function cekListDriver() {
    try {
        const driverList = await contract.methods.getAllDrivers().call();
        document.getElementById('driverListArea').innerText = "List Address: " + JSON.stringify(driverList);
    } catch(e) {
        document.getElementById('driverListArea').innerText = "Gagal ambil list driver.";
    }
}