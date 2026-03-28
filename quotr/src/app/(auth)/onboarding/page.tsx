"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  postcode: string;
  kvk_number: string;
  btw_number: string;
  iban: string;
}

interface Service {
  name: string;
  price: string;
  price_type: "fixed" | "hourly";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Step 1: Company details
  const [company, setCompany] = useState<CompanyDetails>({
    name: "",
    address: "",
    city: "",
    postcode: "",
    kvk_number: "",
    btw_number: "",
    iban: "",
  });

  // Step 2: Services
  const [services, setServices] = useState<Service[]>([
    { name: "", price: "", price_type: "fixed" },
  ]);

  // Step 3: Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch current user and prefill company name
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (userData?.company_id) {
        setCompanyId(userData.company_id);

        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", userData.company_id)
          .single();

        if (companyData?.name) {
          setCompany((prev) => ({ ...prev, name: companyData.name }));
        }
      }
    };

    fetchUser();
  }, [router]);

  const updateCompany = (field: keyof CompanyDetails, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  };

  const updateService = (
    index: number,
    field: keyof Service,
    value: string
  ) => {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { name: "", price: "", price_type: "fixed" },
    ]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStep1 = async () => {
    if (!companyId) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("companies")
        .update({
          name: company.name,
          address: company.address,
          city: company.city,
          postcode: company.postcode,
          kvk_number: company.kvk_number,
          btw_number: company.btw_number,
          iban: company.iban,
        })
        .eq("id", companyId);

      if (updateError) {
        setError("Bedrijfsgegevens opslaan mislukt.");
        return;
      }

      setStep(2);
    } catch {
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!companyId) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const validServices = services.filter((s) => s.name && s.price);

      if (validServices.length > 0) {
        const { error: serviceError } = await supabase
          .from("services")
          .insert(
            validServices.map((s) => ({
              company_id: companyId,
              name: s.name,
              price: parseFloat(s.price),
              price_type: s.price_type,
            }))
          );

        if (serviceError) {
          setError("Diensten opslaan mislukt.");
          return;
        }
      }

      setStep(3);
    } catch {
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (skip: boolean = false) => {
    if (!companyId) return;
    setError(null);
    setLoading(true);

    try {
      if (!skip && logoFile) {
        const supabase = createClient();
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${companyId}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) {
          setError("Logo uploaden mislukt.");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("logos").getPublicUrl(filePath);

        await supabase
          .from("companies")
          .update({ logo_url: publicUrl })
          .eq("id", companyId);
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full rounded-[6px] border border-[#e4e4e7] px-3 py-2 text-sm text-[#111112] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent";
  const labelClassName = "block text-sm font-medium text-[#111112] mb-1.5";

  return (
    <div className="bg-white border border-[#e4e4e7] rounded-xl p-8 shadow-sm">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s === step
                  ? "bg-[#111112] text-white"
                  : s < step
                  ? "bg-[#2563eb] text-white"
                  : "bg-[#e4e4e7] text-gray-500"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-0.5 ${
                  s < step ? "bg-[#2563eb]" : "bg-[#e4e4e7]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-[6px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Company details */}
      {step === 1 && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#111112]">
              Bedrijfsgegevens
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Vul je bedrijfsgegevens aan voor op je offertes
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className={labelClassName}>
                Bedrijfsnaam
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={company.name}
                onChange={(e) => updateCompany("name", e.target.value)}
                placeholder="Mijn Bedrijf B.V."
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="address" className={labelClassName}>
                Adres
              </label>
              <input
                id="address"
                type="text"
                value={company.address}
                onChange={(e) => updateCompany("address", e.target.value)}
                placeholder="Keizersgracht 100"
                className={inputClassName}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="postcode" className={labelClassName}>
                  Postcode
                </label>
                <input
                  id="postcode"
                  type="text"
                  value={company.postcode}
                  onChange={(e) => updateCompany("postcode", e.target.value)}
                  placeholder="1015 AB"
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="city" className={labelClassName}>
                  Plaats
                </label>
                <input
                  id="city"
                  type="text"
                  value={company.city}
                  onChange={(e) => updateCompany("city", e.target.value)}
                  placeholder="Amsterdam"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="kvk" className={labelClassName}>
                  KVK-nummer
                </label>
                <input
                  id="kvk"
                  type="text"
                  value={company.kvk_number}
                  onChange={(e) => updateCompany("kvk_number", e.target.value)}
                  placeholder="12345678"
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="btw" className={labelClassName}>
                  BTW-nummer
                </label>
                <input
                  id="btw"
                  type="text"
                  value={company.btw_number}
                  onChange={(e) => updateCompany("btw_number", e.target.value)}
                  placeholder="NL123456789B01"
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label htmlFor="iban" className={labelClassName}>
                IBAN
              </label>
              <input
                id="iban"
                type="text"
                value={company.iban}
                onChange={(e) => updateCompany("iban", e.target.value)}
                placeholder="NL91 ABNA 0417 1643 00"
                className={inputClassName}
              />
            </div>

            <button
              type="button"
              onClick={handleStep1}
              disabled={loading || !company.name}
              className="w-full bg-[#111112] text-white rounded-[6px] px-4 py-2.5 text-sm font-medium hover:bg-[#111112]/90 focus:outline-none focus:ring-2 focus:ring-[#111112] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Opslaan..." : "Volgende"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#111112]">
              Je diensten
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Voeg je diensten toe zodat je snel offertes kunt maken
            </p>
          </div>

          <div className="space-y-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="border border-[#e4e4e7] rounded-[6px] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#111112]">
                    Dienst {index + 1}
                  </span>
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Verwijderen
                    </button>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`serviceName-${index}`}
                    className={labelClassName}
                  >
                    Naam
                  </label>
                  <input
                    id={`serviceName-${index}`}
                    type="text"
                    value={service.name}
                    onChange={(e) =>
                      updateService(index, "name", e.target.value)
                    }
                    placeholder="Bijv. Webdesign"
                    className={inputClassName}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`servicePrice-${index}`}
                      className={labelClassName}
                    >
                      Prijs (&euro;)
                    </label>
                    <input
                      id={`servicePrice-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={service.price}
                      onChange={(e) =>
                        updateService(index, "price", e.target.value)
                      }
                      placeholder="0.00"
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`serviceType-${index}`}
                      className={labelClassName}
                    >
                      Type
                    </label>
                    <select
                      id={`serviceType-${index}`}
                      value={service.price_type}
                      onChange={(e) =>
                        updateService(index, "price_type", e.target.value)
                      }
                      className={inputClassName}
                    >
                      <option value="fixed">Vast bedrag</option>
                      <option value="hourly">Per uur</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addService}
              className="w-full border border-dashed border-[#e4e4e7] rounded-[6px] px-4 py-2.5 text-sm font-medium text-gray-500 hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
            >
              + Dienst toevoegen
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-[#e4e4e7] text-[#111112] rounded-[6px] px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Vorige
              </button>
              <button
                type="button"
                onClick={handleStep2}
                disabled={loading}
                className="flex-1 bg-[#111112] text-white rounded-[6px] px-4 py-2.5 text-sm font-medium hover:bg-[#111112]/90 focus:outline-none focus:ring-2 focus:ring-[#111112] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Opslaan..." : "Volgende"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Logo upload */}
      {step === 3 && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#111112]">
              Bedrijfslogo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload je logo voor op offertes en facturen
            </p>
          </div>

          <div className="space-y-4">
            <div className="border border-dashed border-[#e4e4e7] rounded-[6px] p-8 text-center">
              {logoPreview ? (
                <div className="space-y-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="mx-auto max-h-32 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-400">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">
                    Klik om een logo te uploaden
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG of SVG (max 2MB)
                  </p>
                </div>
              )}
              <label className="relative block cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoChange}
                  className="sr-only"
                />
                {!logoPreview && (
                  <span className="inline-block mt-2 text-sm font-medium text-[#2563eb] hover:underline cursor-pointer">
                    Bestand kiezen
                  </span>
                )}
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 border border-[#e4e4e7] text-[#111112] rounded-[6px] px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Vorige
              </button>
              <button
                type="button"
                onClick={() => handleStep3(false)}
                disabled={loading || !logoFile}
                className="flex-1 bg-[#111112] text-white rounded-[6px] px-4 py-2.5 text-sm font-medium hover:bg-[#111112]/90 focus:outline-none focus:ring-2 focus:ring-[#111112] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Uploaden..." : "Afronden"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleStep3(true)}
              disabled={loading}
              className="w-full text-sm text-gray-500 hover:text-[#2563eb] transition-colors"
            >
              Later doen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
