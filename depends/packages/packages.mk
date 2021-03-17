packages:=boost openssl libevent

protobuf_native_packages = native_protobuf
protobuf_packages = protobuf

qt_packages = zlib

qrencode_packages = qrencode

qt_linux_packages:=qt expat libxcb xcb_proto libXau xproto freetype fontconfig

qt_darwin_packages=qt
qt_mingw32_packages=qt

bdb_packages=bdb
sqlite_packages=sqlite

zmq_packages=zeromq

upnp_packages=miniupnpc
natpmp_packages=libnatpmp

darwin_native_packages = native_biplist native_ds_store native_mac_alias

ifneq ($(build_os),darwin)
darwin_native_packages += native_cctools native_libtapi native_libdmg-hfsplus

ifeq ($(strip $(FORCE_USE_SYSTEM_CLANG)),)
darwin_native_packages+= native_clang
endif

endif

jemalloc_packages = jemalloc
