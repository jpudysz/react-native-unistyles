// A 3rd party component for e2e: installed into node_modules, it forwards `style` to a React Native View
// and never re-renders by itself. The Babel plugin skips node_modules, react-native-unistyles/metro swaps its View
const React = require('react')
const { View } = require('react-native')

const Card = React.memo(function Card(props) {
    return React.createElement(View, props)
})

module.exports = { Card }
