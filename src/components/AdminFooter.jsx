const AdminFooter = () => (
  <footer className="border-t  w-full border-white/5 mt-8">
    <div className="px-6 h-14 max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex font-serif text-lg text-white">
        <img src="/favicon.svg" alt="" className="h-6 w-6 mr-2" />
        Luckilo<span className="text-gold">.</span>
      </div>
      <span className="text-xs text-white/20">
        &copy; {new Date().getFullYear()} All rights reserved.
      </span>
    </div>
  </footer>
);

export default AdminFooter;
