### How to run tests

1. Install dependencies

```sh
brew cmake
brew ninja
```

2. Download Hermes

```sh
$ git clone https://github.com/facebook/hermes.git
```

3. Build hermes

```sh
mkdir hermes-debug
cd hermes-debug
cmake -G Ninja -DHERMES_BUILD_APPLE_FRAMEWORK=OFF -DCMAKE_BUILD_TYPE=Debug ../
ninja
```

4. Build tests

```sh
mkdir build
cd build
cmake ..
```

5. Run tests

```sh
ctest
```