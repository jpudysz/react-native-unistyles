[<img alt="react-native-unistyles" src="assets/banner.png">](https://codemask.com)


<picture>
 <source media="(prefers-color-scheme: dark)" srcset="assets/uni-dark.svg">
 <img alt="react-native-unistyles" src="assets/uni-light.svg">
</picture>

## Features
- ⚡ Blazing fast, adds around ~5ms on top of StyleSheet*
- 🎳 Share up to 100% of your styles across platforms in monorepo
- 🎯 Doesn't introduce new components
- 🖥️ Supports custom breakpoints and css-like media queries
- 🎨 Access theme in your StyleSheets and components
- 🪄 Supports dynamic functions to access values from JSX
- 🥳 Compatible with Expo, Expo Go, Bare React Native and React Native Web
- ⚔️ No 3rd party dependencies

*-based on this [benchmark](https://github.com/efstathiosntonas/react-native-style-libraries-benchmark)

## Beta

This project is currently in its beta phase. While it hasn't reached version 1.0.0 yet, it's been tested and proven in a large-scale application, performing flawlessly across hundreds screens and components.

I'm looking for testers to check the typings, scalability and overall usability for your monorepo projects.

Suggestions, ideas, and potential improvements are always welcome!

## Setup


**1. Install library**

```cmd
yarn add react-native-unistyles
```

**2. Define your theme**

You don't have to follow a specific format. Just make an object and add any keys/values you like.

```ts
// theme.ts
export const theme = {
  colors: {
    blood: '#eb4d4b',
    barbie: '#e056fd',
    pumpkin: '#f0932b',
    background: '#ffffff'
  },
  components: {
    typography: {
      bold: {
        fontWeight: 'bold'
      },
      thin: {
        fontWeight: '300'
      }
    }
  },
  margins: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12
  },
  utils: {
    hexToRGBA: (hex: string, opacity: number) => {
      const rgb = hex
        .replace('#', '')
        .split(/(?=(?:..)*$)/)
        .map(x => parseInt(x, 16))
      return `rgba(${rgb.at(0)}, ${rgb.at(1)}, ${rgb.at(2)}, ${opacity})`
    }
  }
}
```
**3. Create breakpoints**

There are no predefined breakpoints. You can name them anything. Just make an object with string keys and number values.

```ts
// breakpoints.ts
export const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    superLarge: 2000,
    tvLike: 4000
}
```

**4. Wrap your app with UnistylesTheme to inject theme**

```tsx
import React from 'react'
import { UnistylesTheme } from 'react-native-unistyles'
import { theme } from './theme'

export const App: React.FunctionComponent = () => (
  <UnistylesTheme theme={theme}>
    // Your App
  </UnistylesTheme>
)
```

**5. Access createStyles and useStyles with a factory**

```ts
// styles.ts

// import library factory
import { createUnistyles } from 'react-native-unistyles'
// import your breakpoints, add whatever keys and numeric values you want
import { breakpoints } from './breakpoints'
// import your app's theme TypeScript type, or simply use 'typeof theme'
import { theme } from './theme'

export const {
    createStyles,
    useStyles,
} = createUnistyles<typeof breakpoints, typeof theme>(breakpoints)
```

## Basic Usage

Library gives you two functions from the factory:
- `createStyles` which replaces `StyleSheet.create`
- `useStyles` which parses your styles based on screen height, width and theme

```tsx
import React from 'react'
import { View, Text } from 'react-native'
// access createStyles and useStyles exported from factory
import { createStyles, useStyles } from 'lib/styles'

export const ExampleUnistyles = () => {
    const { styles } = useStyles(stylesheet)

    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Unistyles example
            </Text>
        </View>
    )
}

const stylesheet = createStyles(theme => ({
    container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: theme.colors.background
    },
    text: {
       color: theme.colors.typography
    }
}))
```

`createStyles` takes an object like `StyleSheet.create` or function that injects your theme

`useStyles` hook takes a `stylesheet` and returns an object with two keys:
- `styles` - parsed styles that can be used directly in React Native components
- `theme` - your app's theme that can be used in JSX

You can also skip `stylesheet` if you just want to access `theme`:

```tsx
const { theme } = useStyles()
```

## Breakpoints

Any style can change based on breakpoints. To do this, change a value to an object:

```ts
const stylesheet = createStyles(theme => ({
    container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: {
         // your breakpoints
         xs: theme.colors.background,
         sm: theme.colors.barbie
       }
    },
    text: {
       color: theme.colors.typography
    }
}))
```

Library will choose the correct value (based on screen width) in the runtime.

## Media queries

For more advanced usage and pixel perfect designs you can also use a custom media queries. Library supports 4 types of media queries (w-width, h-height):

```ts
:w[200, 500] - with upper and lower bounds, it translates to width from 200-500px
:w[, 800] - with upper bound only, it's equal to width from 0-800px
:h[400] - lower bound only, it means height from 400px
:h[200, 300]:w[500] - combined queries for both width and height
```

Media queries can be mixed with breakpoints, but have a bigger priority:

```tsx
const stylesheet = createStyles(theme => ({
    container: {
       justifyContent: 'center',
       alignItems: 'center',
       flexDirection: {
          xs: 'column',
          sm: 'row',
       },
       backgroundColor: {
          xs: theme.colors.background,
          ':w[600]': theme.colors.barbie
       }
    },
    text: {
       color: theme.colors.typography
    }
}))
```

## Dynamic functions

Every style can be transformed to dynamic function to take additional parameters from JSX:

```tsx
export const ExampleUnistyles = () => {
    const { styles } = useStyles(stylesheet)
    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            {posts.map((post, index) => (
                <View
                    key={post.key}
                    // call it as regular functions
                    style={styles.post(index)}
                >
                    <Text>
                        {post.title}
                    </Text>
                </View>
            ))}
        </ScrollView>
    )
}

const stylesheet = createStyles({
    scrollContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // dynamic function
    post: (index: number) => ({
        backgroundColor: index % 2 === 0 ? 'gold' : 'silver',
    })
})
```

## Example

In order to check out working example go to [example/](./example).

## Blog post

For more detailed explanation please refer to my blog post [here](https://www.reactnativecrossroads.com/posts/level-up-react-native-styles).

## License

MIT
