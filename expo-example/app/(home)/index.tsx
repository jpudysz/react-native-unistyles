import React from 'react'
import { Star } from 'lucide-react-native'
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { StyleSheet, withUnistyles } from 'react-native-unistyles'
import { Header } from '../../components'

const categories = [
    { id: 'place', name: 'Place' },
    { id: 'hotel', name: 'Hotel' },
    { id: 'flight', name: 'Flight' },
    { id: 'car', name: 'Car' },
];

const popularHotels = [
    {
        id: '1',
        name: 'BaLi Motel Vung Tau',
        location: 'Indonesia',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800',
    },
    {
        id: '2',
        name: 'Luxury Resort & Spa',
        location: 'Maldives',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800',
    },
]

const StyledStar = withUnistyles(Star, theme => ({
    color: theme.colors.onSurface
}))

export default function HotelsScreen() {
    const [activeCategory, setActiveCategory] = React.useState('place')

    alert('Render', 'I\'ve just re-rendered!')

    return (
        <ScrollView style={styles.container}>
            <Header
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
            />
            <View style={styles.hotelsContainer}>
                <View style={styles.heading}>
                    <Text style={styles.sectionTitle}>
                        Popular Hotels
                    </Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>
                            See all
                        </Text>
                    </TouchableOpacity>
                </View>
                {popularHotels.map((hotel) => (
                    <TouchableOpacity key={hotel.id} style={styles.hotelCard}>
                        <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
                        <View style={styles.hotelInfo}>
                            <Text style={styles.hotelName}>
                                {hotel.name}
                            </Text>
                            <Text style={styles.hotelLocation}>
                                {hotel.location}
                            </Text>
                            <View style={styles.hotelRating}>
                                <StyledStar size={16} />
                                <Text style={styles.ratingText}>
                                    {hotel.rating}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background
    },
    heading: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    hotelsContainer: {
        padding: theme.gap(2),
        paddingHorizontal: Math.max(rt.insets.right, theme.gap(2))
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.onBackground,
        marginBottom: theme.gap(2)
    },
    hotelCard: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.gap(2),
        marginBottom: theme.gap(2),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.onSecondary,
        _web: {
            transition: 'transform 0.2s ease-in-out',
            _hover: {
                transform: 'scale(1.01)'
            },
            _before: {
                content: '"Unistyles"',
                color: theme.colors.onSurface
            }
        }
    },
    hotelImage: {
        width: '100%',
        height: 200,
    },
    hotelInfo: {
        padding: theme.gap(2),
    },
    hotelName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.onSurface,
        marginBottom: theme.gap(1),
    },
    hotelLocation: {
        fontSize: 14,
        color: theme.colors.onSurface,
        marginBottom: theme.gap(1),
    },
    hotelRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.onSurface,
        marginLeft: theme.gap(1),
    },
    seeAll: {
        color: theme.colors.onSurface
    }
}))
