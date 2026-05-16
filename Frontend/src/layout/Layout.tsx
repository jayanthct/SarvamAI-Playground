import { Outlet } from 'react-router-dom'
import flower from '../../Assets/Images/flower.svg';

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-white relative">
            <div className='absolute flex flex-col items-start justify-start left-64 top-12'>
                <p className='font-secondary text-xl text-(--secondary-text)'>SarvamAI - Playground</p>
                <p className='font-primary text-(--primary-text)'>Frontend Intern Assignment</p>
            </div>
            <img className='absolute right-0 top-1/2 -translate-y-1/2 h-80' src={flower} alt="flower" />
            <Outlet />
        </div>
    )
}

export default Layout