export function ProfileCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft hover:shadow-soft-md hover-lift transition-all">
      <div className="flex justify-center">
        <img
          src="/images/profile.png"
          alt="Profile"
          className="w-full h-auto max-w-full rounded-lg"
        />
      </div>
    </div>
  );
}
