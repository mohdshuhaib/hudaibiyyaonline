import RegistrationForm from "@/components/RegistrationForm";
import { TrustLogo } from "@/components/TrustBrand";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Institutional Header */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white shadow-md">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:py-6 flex items-center gap-3.5 sm:gap-4">
          <TrustLogo className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-medium text-blue-200">
              ഹുദൈബിയ്യ ഇസ്ലാമിക് ചാരിറ്റബിൾ ട്രസ്റ്റ്
            </p>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
              Hudaibiyya Islamic Charitable Trust
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-100/90 mt-0.5">
              ഔദ്യോഗിക അംഗത്വ രജിസ്ട്രേഷൻ • Official Membership Registration
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        <div className="mb-6 rounded-2xl bg-white border border-blue-100 p-4 sm:p-5 shadow-sm">
          <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
            ഹുദൈബിയ്യ ഇസ്ലാമിക് ചാരിറ്റബിൾ ട്രസ്റ്റിൽ അംഗത്വം എടുക്കുന്നതിനായി താഴെ നൽകിയിട്ടുള്ള
            വിവരങ്ങൾ കൃത്യമായി പൂരിപ്പിക്കുക.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Please fill in the form below accurately to apply for official membership in
            Hudaibiyya Islamic Charitable Trust.
          </p>
        </div>

        <RegistrationForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">
          Hudaibiyya Islamic Charitable Trust • ഹുദൈബിയ്യ ഇസ്ലാമിക് ചാരിറ്റബിൾ ട്രസ്റ്റ്
        </p>
        <p className="mt-1">Official Membership &amp; Verification System</p>
      </footer>
    </div>
  );
}
