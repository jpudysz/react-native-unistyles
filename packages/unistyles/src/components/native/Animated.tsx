import { Animated as RNAnimated } from 'react-native'

import { FlatList } from './FlatList'
import { Image } from './Image'
import { ScrollView } from './ScrollView'
import { SectionList } from './SectionList'
import { Text } from './Text'
import { View } from './View'

type AnimatedComponent<T extends Parameters<typeof RNAnimated.createAnimatedComponent>[0]> = ReturnType<
    typeof RNAnimated.createAnimatedComponent<T>
>

// explicit type keeps emitted declarations portable (RN 0.87+ Strict TypeScript API references private paths)
type UnistylesAnimated = Omit<
    typeof RNAnimated,
    'View' | 'Text' | 'FlatList' | 'Image' | 'ScrollView' | 'SectionList'
> & {
    View: AnimatedComponent<typeof View>
    Text: AnimatedComponent<typeof Text>
    FlatList: AnimatedComponent<typeof FlatList>
    Image: AnimatedComponent<typeof Image>
    ScrollView: AnimatedComponent<typeof ScrollView>
    SectionList: AnimatedComponent<typeof SectionList>
}

export const Animated: UnistylesAnimated = {
    ...RNAnimated,
    View: RNAnimated.createAnimatedComponent(View),
    Text: RNAnimated.createAnimatedComponent(Text),
    FlatList: RNAnimated.createAnimatedComponent(FlatList),
    Image: RNAnimated.createAnimatedComponent(Image),
    ScrollView: RNAnimated.createAnimatedComponent(ScrollView),
    SectionList: RNAnimated.createAnimatedComponent(SectionList),
}
