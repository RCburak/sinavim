import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface DrawingCanvasProps {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
    onEndDrawing?: (path: string) => void;
    initialPath?: string;
    readOnly?: boolean;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    width: canvasWidth = width - 80,
    height: canvasHeight = 150,
    color = '#8B5CF6',
    strokeWidth = 3,
    onEndDrawing,
    initialPath = '',
    readOnly = false,
}) => {
    const [path, setPath] = useState<string>(initialPath);
    const [currentPath, setCurrentPath] = useState<string>('');

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !readOnly,
            onMoveShouldSetPanResponder: () => !readOnly,
            onPanResponderGrant: (evt, gestureState) => {
                if (readOnly) return;
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath(`M${locationX},${locationY}`);
            },
            onPanResponderMove: (evt, gestureState) => {
                if (readOnly) return;
                const { locationX, locationY } = evt.nativeEvent;
                setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
            },
            onPanResponderRelease: () => {
                if (readOnly) return;
                const newPath = path + (path ? ' ' : '') + currentPath;
                setPath(newPath);
                setCurrentPath('');
                if (onEndDrawing) onEndDrawing(newPath);
            },
        })
    ).current;

    const clear = () => {
        setPath('');
        if (onEndDrawing) onEndDrawing('');
    };

    return (
        <View
            style={[styles.container, { width: canvasWidth, height: canvasHeight }]}
            {...(readOnly ? {} : panResponder.panHandlers)}
        >
            <Svg width={canvasWidth} height={canvasHeight}>
                <Path
                    d={path}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d={currentPath}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
});
