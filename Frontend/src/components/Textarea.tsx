import micIcon from '../../Assets/Icons/mic.svg';

const Textarea = () => {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-8">
      <div className="flex items-end bg-white border border-gray-200 rounded-[24px] shadow-sm px-2 py-2">
        <button className="p-3 text-gray-400 hover:text-gray-600 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <textarea
          className="w-full bg-transparent outline-none resize-none px-2 py-3 text-(--primary-text) placeholder-(--primary-text) min-h-[48px] max-h-[120px] overflow-y-auto leading-normal"
          placeholder="What do you want to know?"
          rows={1}
        />
        <div className="flex items-center gap-2 pb-1">
          <button className="p-2 focus:outline-none flex items-center justify-center">
            <img src={micIcon} alt="Mic" className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Textarea;
