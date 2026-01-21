// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RideSharing {
    
    // Enum untuk menyimpan status perjalanan
    enum RideStatus { 
        Requested, 
        Accepted, 
        Funded, 
        CompletedByDriver, 
        Finalized, 
        Cancelled 
    }

    // Struktur data untuk Pengemudi
    struct Driver {
        address walletAddress;
        string name;
        uint256 tariff; // Tarif per perjalanan (wei)
        bool isRegistered;
    }

    // Struktur data untuk Perjalanan
    struct Ride {
        uint256 rideId;
        address passenger;
        address driver;
        uint256 amount; // Jumlah uang yang dibayar
        RideStatus status;
        bool exists;
    }

    // Mapping untuk menyimpan data
    mapping(address => Driver) public drivers; // Mencari driver berdasarkan address
    address[] public driverList; // Menyimpan list address driver agar bisa ditampilkan di frontend
    
    mapping(uint256 => Ride) public rides; // Mencari ride berdasarkan ID
    uint256 public rideCounter; // Untuk membuat ID orderannya

    // Events untuk log aktivitas
    event DriverRegistered(address driver, string name);
    event RideRequested(uint256 rideId, address passenger);
    event RideAccepted(uint256 rideId, address driver);
    event RideFunded(uint256 rideId, uint256 amount);
    event RideCompleted(uint256 rideId);
    event RideFinalized(uint256 rideId, uint256 amountTransferred);
    event RideCancelled(uint256 rideId);

    // Data Driver

    /**
     * @dev Mendaftarkan driver baru.
     * @param _name Nama driver.
     * @param _tariff Tarif yang diinginkan driver (dalam Wei).
     */
    function registerDriver(string memory _name, uint256 _tariff) public {
        require(!drivers[msg.sender].isRegistered, "Anda sudah terdaftar sebagai pengemudi");
        
        drivers[msg.sender] = Driver({
            walletAddress: msg.sender,
            name: _name,
            tariff: _tariff,
            isRegistered: true
        });

        driverList.push(msg.sender);
        emit DriverRegistered(msg.sender, _name);
    }

    /**
     * @dev Melihat data driver berdasarkan address.
     * @param _driverAddress Alamat wallet driver.
     */
    function getDriver(address _driverAddress) public view returns (Driver memory) {
        return drivers[_driverAddress];
    }

    /**
     * @dev mengambil semua address driver
     */
    function getAllDrivers() public view returns (address[] memory) {
        return driverList;
    }

    // Req Order

    /**
     * @dev Membuat pesanan perjalanan oleh penumpang.
     */
    function requestRide() public {
        rideCounter++;
        rides[rideCounter] = Ride({
            rideId: rideCounter,
            passenger: msg.sender,
            driver: address(0), // Belum ada driver
            amount: 0,
            status: RideStatus.Requested,
            exists: true
        });

        emit RideRequested(rideCounter, msg.sender);
    }

    /**
     * @dev Driver menerima pesanan.
     * @param _rideId ID order.
     */
    function acceptRide(uint256 _rideId) public {
        require(drivers[msg.sender].isRegistered, "Hanya pengemudi terdaftar yang bisa menerima");
        require(rides[_rideId].exists, "Pesanan tidak ditemukan");
        require(rides[_rideId].status == RideStatus.Requested, "Status pesanan tidak valid untuk diterima");

        rides[_rideId].driver = msg.sender;
        rides[_rideId].amount = drivers[msg.sender].tariff; // Set harga sesuai tarif driver
        rides[_rideId].status = RideStatus.Accepted;

        emit RideAccepted(_rideId, msg.sender);
    }

    /**
     * @dev Penumpang membayar biaya ke smart contract (Escrow).
     * @param _rideId ID pesanan.
     */
    function fundRide(uint256 _rideId) public payable {
        Ride storage ride = rides[_rideId];
        
        require(msg.sender == ride.passenger, "Hanya penumpang yang bisa membayar");
        require(ride.status == RideStatus.Accepted, "Pesanan belum diterima pengemudi");
        require(msg.value == ride.amount, "Jumlah pembayaran harus sesuai tarif driver");

        ride.status = RideStatus.Funded;
        emit RideFunded(_rideId, msg.value);
    }

    /**
     * @dev Pengemudi menyatakan perjalanan selesai.
     * @param _rideId ID pesanan.
     */
    function completeRide(uint256 _rideId) public {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.driver, "Hanya pengemudi terkait yang bisa menyelesaikan");
        require(ride.status == RideStatus.Funded, "Dana belum disetor penumpang");

        ride.status = RideStatus.CompletedByDriver;
        emit RideCompleted(_rideId);
    }

    // Aturan Dana & Konfirmasi

    /**
     * @dev Penumpang mengonfirmasi selesai. Dana diteruskan ke driver.
     * @param _rideId ID order.
     */
    function confirmArrival(uint256 _rideId) public {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.passenger, "Hanya penumpang yang bisa konfirmasi");
        require(ride.status == RideStatus.CompletedByDriver, "Pengemudi belum menyelesaikan perjalanan");

        ride.status = RideStatus.Finalized;
        
        // TRANSFER DANA KE DRIVER
        // Menggunakan 'payable' untuk mengirim Ether
        payable(ride.driver).transfer(ride.amount);

        emit RideFinalized(_rideId, ride.amount);
    }

    /**
     * @dev Membatalkan pesanan (bisa oleh penumpang atau driver jika belum jalan).
     * Jika sudah dibayar, uang dikembalikan ke penumpang.
     */
    function cancelRide(uint256 _rideId) public {
        Ride storage ride = rides[_rideId];
        require(msg.sender == ride.passenger || msg.sender == ride.driver, "Tidak punya akses");
        require(ride.status == RideStatus.Requested || ride.status == RideStatus.Accepted || ride.status == RideStatus.Funded, "Tidak bisa batal di status ini");

        // Jika uang sudah masuk (Escrow), kembalikan ke penumpang
        if (ride.status == RideStatus.Funded) {
             payable(ride.passenger).transfer(ride.amount);
        }

        ride.status = RideStatus.Cancelled;
        emit RideCancelled(_rideId);
    }
}