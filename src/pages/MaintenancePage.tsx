import { usePublicMaintenance } from "../features/system-settings/hooks";
 

export default function MaintenancePage() {

  const isMobile =
    window.innerWidth < 640;

  const { data } =
    usePublicMaintenance();

  const message =
    data?.maintenance_message ||
    "We are currently improving your digital experience to serve you better.";

  // ======================================================
  // ✅ MOBILE VIEW
  // ======================================================

  if (isMobile) {

    return (
      <div className="fixed inset-0 bg-[#fff] overflow-y-auto">

        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10">

          <img
            src="/maintenance-mobile.jpeg"
            alt="Maintenance"
            className="w-full max-w-sm object-contain mb-10"
          />

          <div className="text-center">

            <h1 className="text-4xl font-bold text-black mb-5">
              We’ll Be Back Soon
            </h1>

            <p className="text-lg text-black leading-relaxed">
              {message}
            </p>

            <p className="mt-5 text-base text-black">
              Expected downtime: 15–30 minutes
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ======================================================
  // ✅ DESKTOP VIEW
  // ======================================================

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">

      <img
        src="/maintenance.jpeg"
        alt="Maintenance"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="relative z-10 flex items-end justify-center w-full h-full px-6 pb-16">

        <div className="text-center max-w-3xl">

          <h1 className="text-5xl font-bold text-black mb-4">
            We’ll Be Back Soon
          </h1>

          <p className="text-xl text-black leading-relaxed">
            {message}
          </p>

          <p className="mt-4 text-base text-black">
            Expected downtime: 15–30 minutes
          </p>

        </div>

      </div>

    </div>
  );
}