func colorFromHexString(_ hexString: String, alpha: CGFloat) -> UIColor? {
    guard (0...1).contains(alpha), hexString.hasPrefix("#") else {
        return nil
    }

    var rgbValue: UInt64 = 0
    var alphaValue: UInt64 = 0xFF

    let hexSanitized = String(hexString.dropFirst())
    let scanner = Scanner(string: hexSanitized)
    let hasAlpha = hexSanitized.count == 8
    
    if (hasAlpha && !scanner.scanHexInt64(&alphaValue)) || !scanner.scanHexInt64(&rgbValue) {
        return nil
    }

    let finalAlpha = hasAlpha ? CGFloat(alphaValue & 0xFF) / 255.0 : alpha

    return UIColor(
        red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
        green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
        blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
        alpha: finalAlpha
    )
}
