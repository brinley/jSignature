set serveroutput on;
declare 
  l_result                        clob;
  c_cr                            varchar2(10) := chr(13);
  c_lf                            varchar2(10) := chr(10);
  c_crlf                          varchar2(10) := c_cr || c_lf;
  c_equals                        varchar2(10) := 'EQUALS';
  c_is_null                       varchar2(10) := 'IS_NULL';

  ------------------------------------------------------------------------------
  -- Subprocedure to evaluate test cases
  ------------------------------------------------------------------------------  
  procedure assert(
    p_test_name                   varchar2,
    p_assert_type                 varchar2 default c_equals,
    p_expected_result             varchar2,
    p_actual_result               varchar2
  ) is
  begin

    dbms_output.put_line('#### Test: ' || p_test_name || '####');
    dbms_output.put_line('Assert: '   || p_assert_type);
    dbms_output.put_line('Expected: ' || p_expected_result);
    dbms_output.put_line('Actual: '   || p_actual_result);
  
    if p_assert_type = c_equals and p_expected_result = p_actual_result then
      dbms_output.put_line('PASSED');
    elsif p_assert_type = c_is_null and p_actual_result is null then
      dbms_output.put_line('PASSED');      
    else
      raise_application_error(-20001, 'ERROR - TEST FAILED:' || p_test_name);
    end if;
  
  end assert;
  
begin

  ------------------------------------------------------------------------------
  -- Test JSON part of the logic
  ------------------------------------------------------------------------------

  -- JSON: Test 1
  l_result := jsignature_pkg.base30_to_json(null);
  
  assert(
    p_test_name       => 'JSON: Test passing null', 
    p_assert_type     => c_equals,
    p_expected_result => '[' || c_lf || ']' || c_lf,  
    p_actual_result   => l_result
    );

  -- JSON: Test 2  
  l_result := jsignature_pkg.base30_to_json('3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4');
  
  assert(
    p_test_name       => 'JSON: Test passing small stroke list', 
    p_assert_type     => c_equals,    
    p_expected_result => '[{"x":[100,101,104,99,104],"y":[50,52,56,50,44]},{"x":[50,51,48],"y":[100,102,98]}]', 
    p_actual_result   => replace(l_result, c_lf, '')
    );

  -- JSON: Test 3  
  l_result := jsignature_pkg.base30_to_json('3v4Z144Y14_m141Z141_4yZ3Y44Z15_j22Z240_3z2345342_1R4210Z223_6L_2C');

  assert(
    p_test_name       => 'JSON: Test passing longer stroke list', 
    p_assert_type     => c_equals,    
    p_expected_result => '[{"x":[91,95,94,90,86,87,91],"y":[22,23,27,28,27,23,22]},{"x":[124,121,125,129,128,123],"y":[19,21,23,21,17,17]},{"x":[95,97,100,104,109,112,116,118],"y":[53,57,59,60,60,58,56,53]},{"x":[197],"y":[68]}]', 
    p_actual_result   => replace(l_result, c_lf, '')
    );
  
  ------------------------------------------------------------------------------
  -- Test all of the logic (JSON + SVG conversion)
  ------------------------------------------------------------------------------
  
  -- SVG: Test 1
  l_result := jsignature_pkg.base30_to_svg('');
  
  assert(
    p_test_name       => 'SVG: Test passing null', 
    p_assert_type     => c_is_null,    
    p_expected_result => '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' || c_lf ||
                         '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' || c_lf ||
                         '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="2" height="2">' || c_lf ||
                         '</svg>',  
    p_actual_result   => l_result
    );

  -- SVG: Test 2  
  l_result := jsignature_pkg.base30_to_svg('3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4');

  assert(
    p_test_name       => 'SVG: Test passing short stroke list', 
    p_assert_type     => c_equals,        
    p_expected_result => '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' || c_lf ||
                         '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' || c_lf ||
                         '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="106" height="104">' || c_lf ||
                         '<path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 100 50 l 0 0 1 2 3 4 -5 -6 5 -6"/>' || c_lf ||
                         '<path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 50 100 l 0 0 1 2 -3 -4"/>' || c_lf ||
                         '</svg>',  
    p_actual_result   => l_result
    );

  -- SVG: Test 3  
  l_result := jsignature_pkg.base30_to_svg('3v4Z144Y14_m141Z141_4yZ3Y44Z15_j22Z240_3z2345342_1R4210Z223_6L_2C');

  assert(
    p_test_name       => 'SVG: Test passing longer stroke list', 
    p_assert_type     => c_equals,        
    p_expected_result => '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' || c_lf ||
                         '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' || c_lf ||
                         '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="199" height="70">' || c_lf ||
                         '<path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 91 22 l 0 0 4 1 -1 4 -4 1 -4 -1 1 -4 4 -1"/>' ||  c_lf ||
                         '<path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 124 19 l 0 0 -3 2 4 2 4 -2 -1 -4 -5 0"/>' || c_lf ||
                         '<path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 95 53 l 0 0 2 4 3 2 4 1 5 0 3 -2 4 -2 2 -3"/>' || c_lf ||
                         '<path fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M 197 68 l 1 -1"/>' || c_lf ||
                         '</svg>',  
    p_actual_result   => l_result
    );


end;
/

