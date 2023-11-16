import autoprefixer from 'autoprefixer'
import postcssNested from 'postcss-nested'
import gradients from 'postcss-easing-gradients'

export default {
    plugins: [
        autoprefixer,
        postcssNested,
        gradients
    ]
}
