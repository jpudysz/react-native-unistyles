# Setup Hermes
git clone https://github.com/facebook/hermes.git
mkdir hermes-debug
cd hermes-debug
cmake -G Ninja -DHERMES_BUILD_APPLE_FRAMEWORK=OFF -DCMAKE_BUILD_TYPE=Debug ../hermes
ninja

# Build debug
cd ../
mkdir cmake-build-debug
cmake -B ./cmake-build-debug -DCMAKE_BUILD_TYPE=Debug
cmake --build ./cmake-build-debug --target unistyles-tests -j 10
