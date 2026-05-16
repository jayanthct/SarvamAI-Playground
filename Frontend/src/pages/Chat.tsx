import Textarea from '../components/Textarea';
import logo from '../../Assets/Images/logo.svg';

const Chat = () => {
  return (
    <main className="grow flex flex-col items-center justify-center p-4 gap-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="sarvam.ai" className="h-20" />
        </div>
        <div className='flex flex-col justify-center items-center gap-1'>
          <p className='font-secondary text-xl text-(--secondary-text)'>Good Morning, Jayanth</p>
          <p className='font-primary text-(--primary-text)'>What&apos;s on your Mind!</p>
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <Textarea />
        {/* <p className='font-primary text-center text-(--primary-text) opacity-50'>Press ⏎ Enter to Send</p> */}
      </div>
    </main>
  );
};

export default Chat;
