[<img alt="react-native-unistyles" src="assets/banner.png">](https://codemask.com)


<picture>
 <source media="(prefers-color-scheme: dark)" srcset="assets/uni-dark.svg">
 <img alt="react-native-unistyles" src="assets/uni-light.svg">
</picture>

## Features
- ⚡ Blazing fast, adds around ~3ms on top of StyleSheet*
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
  margins: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12
  }
}
```

or something more advanced with nested objects / functions:

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

**5. Access createStyleSheet and useStyles with a factory**

```ts
// styles.ts

// import library factory
import { createUnistyles } from 'react-native-unistyles'
// import your breakpoints, add whatever keys and numeric values you want
import { breakpoints } from './breakpoints'
// import your app's theme TypeScript type, or simply use 'typeof theme'
import { theme } from './theme'

export const {
    createStyleSheet,
    useStyles,
} = createUnistyles<typeof breakpoints, typeof theme>(breakpoints)
```

## Basic Usage

After the initial setup, you only need to focus on two functions responsible for your styles:
- `createStyleSheet` which replaces `StyleSheet.create`
- `useStyles` which parses your styles and ensures TypeScript compatibility with media queries and breakpoints

```tsx
import React from 'react'
import { View, Text } from 'react-native'
// access createStyleSheet and useStyles exported from factory
import { createStyleSheet, useStyles } from 'lib/styles'

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

const stylesheet = createStyleSheet(theme => ({
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

## createStyleSheet

`createStyleSheet` is interchangeable with `StyleSheet.create`. You can use objects, and it will function identically to its React Native counterpart.

```ts
const stylesheet = createStyleSheet({
    container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
    },
})
```
The difference is that you can now use breakpoints and media queries:

```ts
const stylesheet = createStyleSheet({
    container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       flexDirection: {
           xs: 'row',
           sm: 'column',
           ':w[800]': 'row'
       }
    },
})
```

`createStyleSheet` also accepts a function, to which the library will inject your theme:

```ts
const stylesheet = createStyleSheet(theme => ({
    container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       flexDirection: {
           xs: 'row',
           sm: 'column',
           ':w[800]': 'row'
       },
       backgroundColor: theme.colors.background
    },
}))
```

Importantly, you'll receive the same TypeScript hints as with `StyleSheet.create`!

## useStyles

`useStyle` ties everything together and handles the heavy lifting. Without `useStyles`, you can't utilize features like:
- breakpoints
- media queries
- themes

_useStyles_ allows you to skip the `stylesheet` if you only want to access the `theme`:

```tsx
const { theme } = useStyles()
```

For more advanced usage, pass your `stylesheet` generated with `createStyleSheet`:

```tsx
// you can still access theme
const { styles, theme } = useStyles(stylesheet)
```

## Breakpoints

Any style can change based on breakpoints. To do this, change a value to an object:

```ts
const stylesheet = createStyleSheet(theme => ({
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

You can even use it with nested objects like `transform` or `shadowOffset`:

```ts
const stylesheet = createStyleSheet(theme => ({
    container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: {
         xs: theme.colors.background,
         sm: theme.colors.barbie
       },
       transform: [
           {
               translateX: 100
           },
           {
               scale: {
                   xs: 1.5,
                   ':w[500]': 1
               }
           }
       ]
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
const stylesheet = createStyleSheet(theme => ({
    container: {
       justifyContent: 'center',
       alignItems: 'center',
       flexDirection: {
          xs: 'column',
          sm: 'row',
       },
       backgroundColor: {
          md: theme.colors.background,
          // even though md might overlap with >600px, lib will use 'barbie'
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
                    // call it as regular function
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

const stylesheet = createStyleSheet({
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
If you use a dynamic function, library will wrap it in a `Proxy` to make sure the correct values of breakpoints will be used:

```ts
const stylesheet = createStyleSheet(theme => ({
    scrollContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    post: (index: number) => ({
        // breakpoints and media queries works with dynamic function
        backgroundColor: {
            xs: index % 2 === 0
                ? theme.colors.gold
                : theme.colors.silver,
            sm: theme.colors.red
        }
    })
}))
```

## Dynamic themes

You can incorporate as many themes as you desire in your application. While there's flexibility in how you structure your theme, it's essential to maintain consistency with the TypeScript type:

To promote reusability and maintainability, it's a good practice to share as many values between themes as possible:

```ts
// move shared colors to object
const sharedColors = {
    barbie: '#ff9ff3',
    oak: '#1dd1a1',
    sky: '#48dbfb',
    fog: '#c8d6e5',
    aloes: '#00d2d3'
}

export const lightTheme = {
    colors: {
        // reuse or override them
        ...sharedColors,
        backgroundColor: '#ffffff',
        typography: '#000000'
    }
    // other keys in common with darkTheme
}

export const darkTheme = {
    colors: {
        // reuse or override them
        ...sharedColors,
        backgroundColor: '#000000',
        typography: '#ffffff'
    }
    // other keys in common with lightTheme
}

// export type that will be used to describe your theme
export type AppTheme = typeof lightTheme | typeof darkTheme
```

With the themes set up, modify your  `createUnistyles` to consume your `AppTheme` type:

```ts
export const { useStyles, createStyleSheet } = createUnistyles<typeof breakpoints, AppTheme>(breakpoints)
```

The final step is to switch your theme based on certain states, persisted values, databases, etc.:

```tsx
export const App: React.FunctionComponent = () => {
    // obtain here your dark or light theme. It can be storage, state, mmkv, or whateber you use
    // const [yourAppTheme] = useState(lightTheme)
    // const [yourAppTheme] = useYourStorage()
    // const [yourAppTheme] = useMMKVObject<AppTheme>(Theme)

    // switching theme will re-render your stylesheets automatically
    return (
        <UnistylesTheme theme={yourAppTheme}>
            <Examples.Extreme />
        </UnistylesTheme>
    )
}
```

## Variants

`react-native-unistyles` isn't a UI/component library, so you're in charge of designing variants. With no restrictions and using your creativity, you can easily create variants for your components.

Let's examine variants for the `Text` component. Imagine you want to create several variants for your `Typography` components:
- Heading
- Regular
- Thin

To achieve this, add variants to your theme:

```ts
export const lightTheme = {
    colors: {
        ...sharedColors,
        backgroundColor: '#ffffff',
        typography: '#000000'
    },
    components: {
        typography: {
            base: {
                fontFamily: 'Roboto',
                fontSize: 12,
            },
            heading: {
                fontFamily: 'Roboto-Medium',
                fontSize: 24,
            },
            regular: {
                fontFamily: 'Roboto',
                fontSize: 12,
            },
            thin: {
                fontFamily: 'Roboto-Thin',
                fontSize: 12,
            },
            bold: {
                fontWeight: 'bold'
            }
        }
    }
}
```
Next, create a base component:

```tsx
import React from 'react'
import type { PropsWithChildren } from 'react'
import { Text, TextStyle } from 'react-native'
import { createStyleSheet, useStyles } from 'lib/styles'

interface BaseTextProps extends PropsWithChildren {
    bold: boolean,
    style: TextStyle
}

export const BaseText: React.FunctionComponent<BaseTextProps> = ({
    children,
    bold = false,
    style = {}
}) => {
    const {styles} = useStyles(stylesheet)

    return (
        <Text
            style={{
                ...styles.baseText,
                ...bold
                    ? styles.baseText
                    : {},
                // pass other styles via props
                ...style
            }}
        >
            {children}
        </Text>
    )
}

const stylesheet = createStyleSheet(theme => ({
    baseText: {
        ...theme.components.typography.base
    },
    bold: {
        ...theme.components.typography.bold
    }
}))
```

Now, let's create another variant, e.g., Heading:

```tsx
import React from 'react'
import type { PropsWithChildren } from 'react'
import { Text, TextStyle } from 'react-native'
import { createStyleSheet, useStyles } from 'lib/styles'
import { BaseText } from 'lib/components'

interface BaseTextProps extends PropsWithChildren {
    bold: boolean,
    text: string
}

export const Heading: React.FunctionComponent<BaseTextProps> = ({
    text,
    bold = false
}) => {
    const { theme } = useStyles()

    return (
        <BaseText
            bold={bold}
            style={theme.components.typography.heading}
        >
            {text}
        </BaseText>
    )
}
```
And so on...

## Migrate from StyleSheet

`react-native-unistyles` embraces the simplicity of `StyleSheet`, making it easy to integrate into your project.

You can replace `StyleSheet.create` with `createStyleSheet` and it will work exactly the same:

```diff
-const styles = StyleSheet.create({
+const styles = createStyleSheet({
    scrollContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})
```

If you need additional functionalities such as `breakpoints`, `media-queries` or `theme` you can incrementally pass `style(sheet)` into the `useStyles` hook:

```ts
export const ExampleUnistyles = () => {
  const { styles } = useStyles(stylesheet)
  // ... your component code
}
```

With the hook in place, you can now use all the features.

## Example

In order to check out working example go to [example/](./example).

## Blog post

For more detailed explanation please refer to my blog post [here](https://www.reactnativecrossroads.com/posts/level-up-react-native-styles).


## Sponsor my work

If you found the `react-native-unistyles` time-saving and valuable, please consider sponsoring my work. Your support enables me to continue creating libraries with a fresh approach.

Github: https://github.com/sponsors/jpudysz

Ko-fi: https://ko-fi.com/jpudysz

Your support is greatly appreciated and helps me dedicate more time and resources to creating quality libraries. Thank you for all the support!

## License

MIT
