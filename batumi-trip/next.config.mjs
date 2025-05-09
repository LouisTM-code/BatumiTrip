/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          // Используем ваш project ref из env-переменной
          hostname: `${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}`,
          // И путь к публичному bucket
          pathname: '/storage/v1/object/public/location-images/**',
        },
      ],
    },
  };
  
  export default nextConfig;
  