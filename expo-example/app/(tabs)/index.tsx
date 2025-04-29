import React from 'react'
import { Link } from 'expo-router'
import { Pressable, View, Text, ScrollView, FlatList, SectionList } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

const DATA = [
  {
    title: 'Main dishes',
    data: ['Pizza', 'Burger', 'Risotto'],
  },
  {
    title: 'Sides',
    data: ['French Fries', 'Onion Rings', 'Fried Shrimps'],
  },
  {
    title: 'Drinks',
    data: ['Water', 'Coke', 'Beer'],
  },
  {
    title: 'Desserts',
    data: ['Cheese Cake', 'Ice Cream'],
  },
];


export default function HomeScreen() {
    styles.useVariants({
        variant: 'blue'
    })

    return (
       <SectionList
        sections={DATA}
        keyExtractor={(item, index) => item + index}
        contentContainerStyle={styles.container()}
        renderItem={({item}) => (
          <View>
            <Text>{item}</Text>
          </View>
        )}
        renderSectionHeader={({section: {title}}) => (
          <Text>{title}</Text>
        )}
      />
    )
}

const styles = StyleSheet.create(theme => ({
    container: () => ({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'blue'
    }),
    typography: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.typography
    },
    test: {
        width: '100%',
        variants: {
            variant: {
                red: {
                    backgroundColor: 'red'
                },
                blue: {
                    backgroundColor: 'blue'
                }
            }
        }
    },
    button: {
        backgroundColor: theme.colors.aloes,
        padding: 10,
        borderRadius: 8,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    }
}))
