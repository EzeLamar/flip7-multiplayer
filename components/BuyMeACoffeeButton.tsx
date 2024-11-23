import Image from "next/image";


export function BuyMeACoffeeButton() {
  return (
    <a href="https://www.buymeacoffee.com/ezelamar" target="_blank">
      <Image
        className="hover:opacity-90"
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        width={150}
        height={35}
      />
    </a>
  );
}
