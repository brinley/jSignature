### @license
# jSignature v2 SVG export plugin.
# Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
# MIT License <http://www.opensource.org/licenses/mit-license.php
#
# Ruby convertion by AlexVangelov

require_relative "j_signature_base30"
require "minitest/autorun"
 
class TestJSignatureBase30 < Minitest::Test
 
  def test_base30_to_native
    signature = "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"
    expected = [
      {
        x: [100,101,104,99,104],
        y: [50,52,56,50,44]
      },
      {
        x: [50,51,48],
        y: [100,102,98]
      }
    ]
    actual = JSignatureBase30.new(signature).to_native
    assert_equal expected, actual
  end
  
  def test_base30_to_svg
    signature = "3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4"
    expected = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="58" height="60"><path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 53 7 l 1 2 3 4 -5 -6 5 -6"/><path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 3 57 l 1 2 -3 -4"/></svg>';
    actual = JSignatureBase30.new(signature).to_svg
    assert_equal expected, actual
  end
 
end