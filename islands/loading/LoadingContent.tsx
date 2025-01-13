import { useLoading } from "$islands/loading/LoadingProvider.tsx";

const LoadingContent = () => {
  const { loading } = useLoading();
  if (!loading) return null;

  return (
    <>
      <div class="w-screen h-screen flex justify-center items-center fixed z-50 bg-[#000000ad]">
        <img
          class="select-none"
          src="/img/loading.gif"
          alt="loading"
        />
      </div>
    </>
  );
};

export default LoadingContent;
