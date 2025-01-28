import { Animated as RNAnimated } from 'react-native'
import { View } from './View'
import { Text } from './Text'
import { FlatList } from './FlatList'
import { Image } from './Image'
import { ScrollView } from './ScrollView'
import { SectionList } from './SectionList'

export const Animated = {
    ...RNAnimated,
    View: RNAnimated.createAnimatedComponent(View),
    Text: RNAnimated.createAnimatedComponent(Text),
    FlatList: RNAnimated.createAnimatedComponent(FlatList),
    Image: RNAnimated.createAnimatedComponent(Image),
    ScrollView: RNAnimated.createAnimatedComponent(ScrollView),
    SectionList: RNAnimated.createAnimatedComponent(SectionList)
}
