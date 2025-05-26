import React from 'react';
import Image from 'next/image';
import MainAppIcon from '../main-app-icon-2.png';

const Header: React.FC = () => {
    return (
        <header className="fixed top-5 px-25 left-1/2 transform -translate-x-1/2 w-fit z-50 backdrop-blur-sm bg-white/20 shadow-md rounded-3xl">
            <div className="flex items-center p-4">
                <span className="ml-3 text-3xl font-bold text-gray-800 pr-5">Wakes</span>
                <Image src={MainAppIcon} alt="Wakes Icon" width={40} height={40} />
            </div>
        </header>
    );
};

export default Header;