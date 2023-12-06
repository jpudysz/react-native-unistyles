import { Swiper } from 'swiper'
import { EffectCoverflow } from 'swiper/modules'

export const init = (isTablet: boolean) => {
    const slidesPerView = isTablet ? 3 : 1.7

    const swiper = new Swiper('.swiper', {
        effect: 'coverflow',
        grabCursor: true,
        modules: [EffectCoverflow],
        centeredSlides: true,
        slidesPerView,
        loop: true,
        spaceBetween: 0,
        coverflowEffect: {
            rotate: 0,
            depth: 1,
            scale: 0.8,
            modifier: 1,
            slideShadows: false
        }
    })

    return () => swiper.destroy(true, true)
}
