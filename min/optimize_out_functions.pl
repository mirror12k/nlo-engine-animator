#!/usr/bin/env perl
use strict;
use warnings;

use feature 'say';


local $/;
my $js = join '', <>;

my $count = ($js =~ s#\w+\.prototype\.(\w+)(\s*=\s*function\s*\([^)]*\))\s*(\{(?:[^\{\}]|(?3))*\})#(-1 != index $js, ".$1." or -1 != index $js, ".$1(") ? $& : ''#gse);

print $js;

