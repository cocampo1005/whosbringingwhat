export default function CookingLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <style>{`
        @keyframes cooking {
          0% {
            transform: rotate(0deg);
            transform-origin: top right;
          }
          10% {
            transform: rotate(-4deg);
            transform-origin: top right;
          }
          50% {
            transform: rotate(20deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes flip {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-100px) rotate(180deg);
          }
          100% {
            transform: translateY(0px) rotate(360deg);
          }
        }

        @keyframes shadow {
          0% {
            transform: scaleX(1);
          }
          50% {
            transform: scaleX(0.7);
          }
          100% {
            transform: scaleX(1);
          }
        }

        .pan {
          animation: cooking 1.7s infinite;
        }

        .food {
          animation: flip 1.7s infinite;
        }

        .panShadow {
          animation: shadow 1.7s infinite;
        }
      `}</style>

      <div className="relative flex w-[200px] flex-col items-end gap-5">
        <div className="pan flex w-full items-start justify-start">
          <div className="relative flex items-start">
            {/* Food */}
            <div
              className="food absolute left-2.5 z-20 h-1.5 w-[40%] rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgb(82, 33, 33), rgb(200, 106, 106))",
              }}
            ></div>

            {/* Pan Base */}
            <div className="z-30 h-[22px] w-[100px] rounded-b-[40px] bg-[#f94a5a]"></div>

            {/* Pan Handle */}
            <div
              className="h-2.5 w-[80px] rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgb(18, 18, 18), rgb(74, 74, 74))",
              }}
            ></div>
          </div>
        </div>

        {/* Pan Shadow */}
        <div className="panShadow ml-[15px] h-2 w-[70px] self-start rounded-full bg-black/20 blur-[5px]"></div>
      </div>
      <p className="mt-4 text-center text-lg font-medium text-gray-700">
        Cooking up something delicious...
      </p>
    </div>
  );
}
