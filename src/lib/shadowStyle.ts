/**
 * Web'de deprecated shadow* uyarısını gidermek için boxShadow kullanır.
 * Native'de shadow* veya boxShadow (platform desteğine göre) döner.
 */
import { Platform } from 'react-native';

type ShadowOffset = { width: number; height: number };

export function shadowStyle(
  offset: ShadowOffset,
  radius: number,
  opacity: number,
  color: string = '#000',
  elevation?: number
): {
  boxShadow?: string;
  shadowColor?: string;
  shadowOffset?: ShadowOffset;
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
} {
  const boxShadowStr = `${offset.width}px ${offset.height}px ${radius}px 0px rgba(0,0,0,${opacity})`;

  if (Platform.OS === 'web') {
    return { boxShadow: boxShadowStr };
  }
  const out: ReturnType<typeof shadowStyle> = {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
  if (elevation != null) out.elevation = elevation;
  return out;
}
