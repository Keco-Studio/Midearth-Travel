import Image from "next/image";
import styles from "./listing.module.css";

type Props = {
  eyebrow: string;
  title: string;
  sub: string;
  img: string;
};

export function SubHero({ eyebrow, title, sub, img }: Props) {
  return (
    <section className={styles.subHero}>
      <div className={styles.subHeroImg}>
        <Image
          src={img}
          alt=""
          fill
          unoptimized
          priority
          sizes="100vw"
          className={styles.subHeroImgEl}
        />
        <div className={styles.subHeroVeil} />
      </div>
      <div className={styles.subHeroInner}>
        <div className={styles.eyebrow}>— {eyebrow}</div>
        <h1 className={styles.subHeroTitle}>{title}</h1>
        <p className={styles.subHeroSub}>{sub}</p>
      </div>
    </section>
  );
}
