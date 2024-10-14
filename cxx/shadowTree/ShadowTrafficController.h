#pragma once

namespace margelo::nitro::unistyles::shadow {

// Like a traffic officer managing a jam, this struct ensures everything
// is synchronized within a set timeframe, controlling flow and preventing chaos.
struct ShadowTrafficController {
    inline bool hasUnistylesCommit() {
        return _hasCommit;
    }
    
    inline void setHasUnistylesCommit(bool hasCommit) {
        this->_hasCommit = hasCommit;
    }
    
    inline bool shouldStop() {
        return !_canCommit;
    }
    
    inline void stopUnistylesTraffic() {
        this->_canCommit = false;
    }
    
    inline void resumeUnistylesTraffic() {
        this->_canCommit = true;
    }
    
private:
    bool _hasCommit = false;
    bool _canCommit = false;
};

}
