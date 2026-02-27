import Foundation

struct KeyboardAnimation {
    var animatedImeInset: CGFloat = 0
    var keyboardHeight: CGFloat = 0
    var animationDuration: Double = 0
    var displayLink: CADisplayLink?
    var startTime: CFTimeInterval = 0
    var from: CGFloat = 0
    var to: CGFloat = 0
}

extension NativeIOSPlatform {
    func setupKeyboardListeners() {
        NotificationCenter.default.addObserver(self, selector: #selector(onKeyboardWillShow), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(onKeyboardWillHide), name: UIResponder.keyboardWillHideNotification, object: nil)
    }

    func removeKeyboardListeners() {
        keyboardAnimation.displayLink?.invalidate()

        NotificationCenter.default.removeObserver(
             self,
             name: UIResponder.keyboardWillShowNotification,
             object: nil
         )
         NotificationCenter.default.removeObserver(
             self,
             name: UIResponder.keyboardWillHideNotification,
             object: nil
         )
    }

    @objc func onKeyboardWillShow(notification: NSNotification) {
        guard let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect else { return }
        guard let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double else { return }

        keyboardAnimation.keyboardHeight = frame.height
        keyboardAnimation.animationDuration = duration

        startAnimation(toValue: keyboardAnimation.keyboardHeight)
    }

    @objc func onKeyboardWillHide(notification: NSNotification) {
        guard let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double else { return }

        keyboardAnimation.animationDuration = duration

        startAnimation(toValue: 0)
    }

    func startAnimation(toValue targetValue: CGFloat) {
        keyboardAnimation.startTime = CACurrentMediaTime()
        keyboardAnimation.displayLink?.invalidate()

        keyboardAnimation.from = keyboardAnimation.animatedImeInset
        keyboardAnimation.to = targetValue

        if (keyboardAnimation.from == keyboardAnimation.to) {
            return
        }

        keyboardAnimation.displayLink = CADisplayLink(target: self, selector: #selector(updateAnimation))
        keyboardAnimation.displayLink?.add(to: .main, forMode: .default)
    }

    @objc func updateAnimation() {
        let elapsedTime = CACurrentMediaTime() - keyboardAnimation.startTime
        let linearProgress = min(elapsedTime / keyboardAnimation.animationDuration, 1)
        let easedProgress = 1 - pow(1 - linearProgress, 3)

        // Interpolate between 'from' and 'to'
        keyboardAnimation.animatedImeInset = keyboardAnimation.from + (keyboardAnimation.to - keyboardAnimation.from) * CGFloat(easedProgress)

        guard let current = self.miniRuntime else { return }

        let newInsets = Insets(
            top: current.insets.top,
            bottom: current.insets.bottom,
            left: current.insets.left,
            right: current.insets.right,
            ime: Double(keyboardAnimation.animatedImeInset)
        )

        self.miniRuntime = UnistylesNativeMiniRuntime(
            colorScheme: current.colorScheme,
            screen: current.screen,
            contentSizeCategory: current.contentSizeCategory,
            insets: newInsets,
            pixelRatio: current.pixelRatio,
            fontScale: current.fontScale,
            rtl: current.rtl,
            statusBar: current.statusBar,
            navigationBar: current.navigationBar,
            isPortrait: current.isPortrait,
            isLandscape: current.isLandscape
        )
        self.emitImeEvent(updatedMiniRuntime: self.miniRuntime!)

        if linearProgress >= 1 {
            keyboardAnimation.displayLink?.invalidate()
            keyboardAnimation.displayLink = nil
        }
    }
}
