require 'json'

def get_rn_version(rn_path)
    rn_path = rn_path || '../node_modules/react-native'

    maybe_rn_pkg_json = File.expand_path(File.join(rn_path, 'package.json'))
    maybe_local_rn_pkg_json = File.expand_path('./node_modules/react-native/package.json')

    rn_pkg_json =
        if File.exist?(maybe_rn_pkg_json)
            maybe_rn_pkg_json
        elsif File.exist?(maybe_local_rn_pkg_json)
            maybe_local_rn_pkg_json
        else
            nil
        end

    unless rn_pkg_json
        warn "🦄 Unistyles: React Native not found. Frameworks :static will use all dependencies which might fail for older versions of React Native."
        return nil
    end

    rn_pkg = JSON.parse(File.read(rn_pkg_json))
    rn_version = rn_pkg['version']
    parsed_version = rn_version.split('.')[1].to_i

    parsed_version
end
