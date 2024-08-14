# Boost for React Native

This is the subset of [Boost](http://www.boost.org/) required by React Native. It includes only the Boost source code (without the docs, for example) that is needed by RN.

Do not use this repo directly: its sole purpose is to distribute Boost code for building React Native.

This library does not necessarily follow semver. It follows Boost's versioning plus a number in the prerelease identifier position. React Native declares the exact version of this library it depends on instead of using semver ranges.

## Upgrading Boost

First, download a new version of Boost, e.g.: http://www.boost.org/users/history/version_1_63_0.html

Then create a dummy commit and a git tag so you can create a new release.

React Native build tools (Gradle and Cocoapods) expect specific folder structure.
Run this command to get a .tar.gz file:

```
tar -cvzf boost_<version>.tar.gz boost_<version>/
```

Then drag&drop the tar.gz file to the releases page.


## License

The Boost Software License 1.0 is included with this repository and its releases.
