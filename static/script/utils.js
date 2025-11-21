export const deg2rad = (deg) => {
    /* since:
    - 360° = 2π radians
    - 180° = π radians (devide by 180)
    - 180°/180 = π/180 radians
    - 1° = π/180 radians
    - 45° = 45*π/180 radians
    hence: x° = x*π/180 radians
    */
    return deg * Math.PI / 180
}