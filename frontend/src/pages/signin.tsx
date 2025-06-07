import { CardBody, CardContainer, CardItem } from "../components/ui/3d-card";
import { WavyBackground } from "../components/ui/wavy-background";

export default function SignInPage() {
  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40">
      <div className="flex flex-col items-center justify-center">
        <p className="text-2xl md:text-4xl lg:text-7xl text-white font-bold inter-var text-center">
          Hello, I'm meridian
        </p>
        <p className="text-base md:text-lg mt-4 text-white font-normal inter-var text-center">
          Your AI-powered personal assistant
        </p>
        <CardContainer>
          <CardBody>
            <CardItem
              as="button"
              translateZ="60"
              className="px-8 py-4 rounded-xl bg-black dark:bg-white dark:text-black text-white text-lg font-bold"
              onClick={() => console.log("Sign in button clicked")}
            >
              Sign In
            </CardItem>
          </CardBody>
        </CardContainer>
      </div>
    </WavyBackground>
  );
}
