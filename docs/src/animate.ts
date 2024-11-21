const unicorn = document.querySelector<HTMLDivElement>('.unicorn')!
const light = document.querySelector<HTMLDivElement>('.light')!
const clouds = document.querySelector<HTMLDivElement>('.clouds')!
const mobileQuery = window.matchMedia('(max-width: 991px)')

const handler = (event: MouseEvent) => {
    const x = mobileQuery.matches ? 0 : (event.clientX - (window.innerWidth / 2)) / window.innerWidth * 2
    const y = mobileQuery.matches ? 0 : (event.clientY - (window.innerHeight / 2)) / window.innerHeight * 2

    unicorn.style.transform = `translate(${x * 15}px, ${y * 15}px)`
    light.style.transform = `translate(${x * 15}px, ${y * 15}px)`
    clouds.style.transform = `translate(${x * 30}px, ${y * 30}px)`
    canvas.style.transform = `rotateY(${x * -7}deg) rotateX(${y * -7}deg)`
}

window.addEventListener('mousemove', handler)

type Star = {
    x: number
    y: number
    size: number
    speedX: number
    speedY: number
    glow: number
}

const createStar = () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: getRandom(0.5, 2),
    speedX: getRandom(-0.05, 0.05),
    speedY: getRandom(-0.05, 0.05),
    glow: getRandom(0, 10)
})

const canvas = document.querySelector<HTMLCanvasElement>('.galaxy')!
const ctx = canvas.getContext('2d')!
const getRandom = (min: number, max: number) => Math.random() * (max - min) + min
const stars = new Set<Star>()

const configCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    ctx.shadowColor = '#fff'
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7})`
    stars.clear()
    Array.from({ length: Math.floor(canvas.width * canvas.height / 25_000) }, () => stars.add(createStar()))
}

configCanvas()

let debounceId: NodeJS.Timeout

window.addEventListener('resize', () => {
    clearTimeout(debounceId)
    debounceId = setTimeout(() => {
        configCanvas()
    }, 50)
})

const drawStars = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    stars.forEach(star => {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.shadowBlur = star.glow
        ctx.fill()

        star.x += star.speedX
        star.y += star.speedY

        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0
    })
}

const animate = () => {
    drawStars()
    requestAnimationFrame(animate)
}

requestAnimationFrame(animate)

const createAnimation = (updateFn: (progress: number) => void, duration: number, end: number) => {
    let startTime: number | null = null

    const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime
        const elapsedTime = currentTime - startTime
        const progress = Math.min(elapsedTime / duration, end)

        updateFn(progress)

        if (progress < end) {
            requestAnimationFrame(animate)
        }
    }

    requestAnimationFrame(animate)
}
