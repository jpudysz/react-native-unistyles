### How to run tests

1. Install dependencies

```sh
brew cmake
brew ninja
```

2. Run setup script

```sh
./setup.sh
```

3. Run tests

```sh
./cmake-build-debug/unistyles-tests
```

4. Build release (optional)

```sh
mkdir cmake-build-release
cmake -B ./cmake-build-release -DCMAKE_BUILD_TYPE=Release
cmake --build ./cmake-build-release --target unistyles-tests -j 10
./cmake-build-release/unistyles-tests
```

5. Create watcher

```sh
cmake --build ./cmake-build-debug --target unistyles-tests -j 10 && ./cmake-build-debug/unistyles-tests
```
