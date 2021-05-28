create or replace package body jsignature_pkg as
/**********************************************************************************
*
* Description: Package containing code related to jSignature data extraction
*
*
* Modification History:
*
* Date           Who              Description
* ============   ================ ===========
* 24 May 2021    Ben Wetherall     Initial version 
*
**********************************************************************************/

/*******************************************************************************
*    Name: debug
* Purpose: Output debug information
*******************************************************************************/
procedure debug (
  p_statement_debug_level         number,
  p_debug_string                  varchar2
) is
begin

  if gc_current_debug_level >= p_statement_debug_level then
    dbms_output.put_line(p_debug_string);
  end if;
  
end debug;

/*******************************************************************************
*    Name: string_to_array
* Purpose: Take string - return each character as array elements
*******************************************************************************/
function string_to_array (
  p_string                        varchar2
) return apex_t_varchar2 is
   l_result_array                 apex_t_varchar2 := apex_t_varchar2();
   l_index                        number;
begin

  l_result_array.extend(length(p_string));

  for l_index in 1 .. l_result_array.count loop  
    l_result_array(l_index) := substr(p_string, l_index, 1);
  end loop;

  return l_result_array;

end string_to_array;

/*******************************************************************************
*    Name: intval
* Purpose: Convert number from other base to integer (base 10)
*******************************************************************************/
function intval (
  p_value                         varchar2,
  p_from_base                     number
) return number is
  c_hex                           varchar2(30) default '0123456789ABCDEFGHIJKLMNOPQRST';
  l_result                        number := 0;
begin

  if ( p_value is null or p_from_base is null ) then
    return null;
  end if;
   
  for i in 1 .. length(p_value) loop
    l_result := l_result * p_from_base + instr(c_hex, upper(substr(p_value,i,1)))-1;
  end loop;

  return l_result;

end intval;

/*******************************************************************************
*    Name: initialise_globals
* Purpose: Set up character maps
*******************************************************************************/
procedure initialise_globals is
  l_allchars                      apex_t_varchar2;
  l_index                         number;
  l_display_index                 varchar2(10);
  
begin

  l_allchars := string_to_array('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX');
  gc_bitness := (l_allchars.count) / 2;

  -- Loop over allchar array
  l_index := gc_bitness;

  loop
    gc_charmap(l_allchars(l_index)) := l_allchars(l_index + gc_bitness);
    gc_charmap_reverse(l_allchars(l_index + gc_bitness)) := l_allchars(l_index);

    l_index := l_index - 1;
    exit when l_index = 0;

  end loop;
  
  -- Display array content (if debug turned on)
  l_display_index := gc_charmap.first;
  while l_display_index is not null loop
    debug(gc_debug_detailed, 'Charmap ' || l_display_index || ' : ' || gc_charmap(l_display_index));
    l_display_index := gc_charmap.next(l_display_index);  
  end loop;

  l_display_index := gc_charmap_reverse.first;
  while l_display_index is not null loop
    debug(gc_debug_detailed, 'Reverse ' || l_display_index || ' : ' || gc_charmap_reverse(l_display_index));
    l_display_index := gc_charmap_reverse.next(l_display_index);  
  end loop;

end initialise_globals;

/*******************************************************************************
*    Name: uncompress_stroke_leg
* Purpose: Uncompress part of a stroke
*******************************************************************************/
function uncompress_stroke_leg (
  p_stroke_data_string            varchar2
) return apex_t_number is

  l_answer_array                  apex_t_number := apex_t_number();
  l_char_array                    apex_t_varchar2;
  l_length                        number;
  l_current_char                  varchar2(1);
  l_polarity                      number := 1;
  l_partial_array                 apex_t_varchar2 := apex_t_varchar2();
  l_preprewhole                   number := 0;
  l_prewhole                      number := 0;

begin

  -- Split string into array
  l_char_array := jsignature_pkg.string_to_array(p_stroke_data_string);
  l_length := l_char_array.count;
  
  -- Loop over each character
  for l_index in 1 .. l_length loop
  
    debug(gc_debug_detailed, 'partialarray ' || apex_string.join(l_partial_array,','));
    debug(gc_debug_detailed, 'answerarray  ' || apex_string.join(l_answer_array,','));

    l_current_char := l_char_array(l_index);
    
    if gc_charmap.exists(l_current_char) or l_current_char = gc_minus or l_current_char = gc_plus then
    
      if l_partial_array.count != 0 then
        l_prewhole := jsignature_pkg.intval(apex_string.join(l_partial_array,''), gc_bitness) * l_polarity + l_preprewhole;
        l_answer_array.extend;
        l_answer_array(l_answer_array.last) := l_prewhole;
        l_preprewhole := l_prewhole;
        l_partial_array.delete;     
      end if;
      
      if l_current_char = gc_minus then
        l_polarity := -1;
        l_partial_array := apex_t_varchar2();
      elsif l_current_char = gc_plus then
        l_polarity := 1;
        l_partial_array := apex_t_varchar2();
      else
        l_partial_array.extend;
        l_partial_array(l_partial_array.last) := l_current_char;
      end if;
    
    else    
      -- more parts for the new number
      l_partial_array.extend;
      l_partial_array(l_partial_array.last) := gc_charmap_reverse(l_current_char);
    end if;

  end loop;

  -- we always will have something stuck in partial
  l_answer_array.extend;
  l_answer_array(l_answer_array.last) := jsignature_pkg.intval(apex_string.join(l_partial_array,''), gc_bitness) * l_polarity + l_preprewhole;

  debug(gc_debug_detailed, 'answerarrayfinal  ' || apex_string.join(l_answer_array,','));

  return l_answer_array;

end uncompress_stroke_leg;

/*******************************************************************************
*    Name: base30_to_json
* Purpose: Convert jSignature base30 encoded string to JSON (with stroke details)
*******************************************************************************/
function base30_to_json (
  p_base30_string                 varchar2
) return clob is
  l_return_clob                   clob;
  l_chunk_array                   apex_t_varchar2;
  l_x_stroke_array                apex_t_number;
  l_y_stroke_array                apex_t_number;
  l_entry_count                   number;
  l_index                         number := 0;
begin

  initialise_globals;

  -- Split input into chunks per stroke + axis
  l_chunk_array := apex_string.split(p_base30_string, gc_chunk_separator);
  l_entry_count := l_chunk_array.count / 2;

  debug(gc_debug_detailed, 'Found Chunks:' || l_chunk_array.count);

  -- Initialise json and start array
  apex_json.initialize_clob_output;
  apex_json.open_array;  
  
  -- Loop over chunks
  loop
  
    exit when l_index >= l_chunk_array.count;

    debug(gc_debug_basic, 'x:' || apex_string.join(l_x_stroke_array, ',') || ' y:' || apex_string.join(l_y_stroke_array, ','));  

    -- Uncompress x and y strokes
    l_x_stroke_array := jsignature_pkg.uncompress_stroke_leg(l_chunk_array(l_index + 1));
    l_y_stroke_array := jsignature_pkg.uncompress_stroke_leg(l_chunk_array(l_index + 2));

    apex_json.open_object;  
    apex_json.write('x', l_x_stroke_array);
    apex_json.write('y', l_y_stroke_array);
    apex_json.close_object;  
    
    l_index := l_index + 2;
    
  end loop;

  -- Finalise the JSON
  apex_json.close_array;
  l_return_clob := apex_json.get_clob_output;
  apex_json.free_output;
     
  return l_return_clob;   
   
end base30_to_json;

/*******************************************************************************
*    Name: generate_stroke_path
* Purpose: Generate SVG path element for given X/Y arrays
*******************************************************************************/
function generate_stroke_path (
  p_x_stroke_array                apex_t_number,
  p_y_stroke_array                apex_t_number,
  p_minx                          number,
  p_miny                          number
) return varchar2 is
  l_return_string                 varchar2(30000);
  l_path_string                   varchar2(20000);
  l_lastx                         number;
  l_lasty                         number;
  l_index                         number;
  
begin

  l_lastx := p_x_stroke_array(1);
  l_lasty := p_y_stroke_array(1);

  l_path_string := 'M ' || round(l_lastx - p_minx) || ' ' || round(l_lasty - p_miny) || ' l';

  -- Meaning this was just a DOT, not a stroke
  if p_x_stroke_array.count = 1 then
    l_path_string := l_path_string || ' 1 -1';
  else
  
    -- Process stroke
    for l_index in 1 .. p_x_stroke_array.count loop
    
      l_path_string := l_path_string || ' ' || (p_x_stroke_array(l_index) - l_lastx);
      l_path_string := l_path_string || ' ' || (p_y_stroke_array(l_index) - l_lasty);
      
      l_lastx := p_x_stroke_array(l_index);
      l_lasty := p_y_stroke_array(l_index);
    
    end loop;
  
  end if;

  -- Build path element and return it
  l_return_string := '<path fill="none" stroke="#000000" stroke-width="2"' ||
                     ' stroke-linecap="round" stroke-linejoin="round"' ||
                     ' d="' || l_path_string || '"/>';  
  return l_return_string;

end generate_stroke_path;

/*******************************************************************************
*    Name: calculate_dimensions
* Purpose: Work out dimensions based on the stroke array
*******************************************************************************/
procedure calculate_dimensions (
  p_json_object                   apex_json.t_values,
  p_sizex                     out number,
  p_sizey                     out number,
  p_minx                      out number,
  p_miny                      out number
) is

  l_array_size                    number;  
  l_index                         number;  
  l_x_stroke_array                apex_t_number;
  l_y_stroke_array                apex_t_number;

  l_current_minx                  number;
  l_current_maxx                  number;
  l_current_miny                  number;
  l_current_maxy                  number;
  l_overall_minx                  number := 0;
  l_overall_maxx                  number := 0;
  l_overall_miny                  number := 0;
  l_overall_maxy                  number := 0;

  l_padding                       number := 1;

begin

  l_array_size := apex_json.get_count(p_path => '.', p_values => p_json_object);  

  -- Loop over stroke array
  for l_index in 1 .. l_array_size loop

    l_x_stroke_array := apex_json.get_t_number (
                          p_values => p_json_object,
                          p_path   => '[%d].x',
                          p0       => l_index
                          );

    l_y_stroke_array := apex_json.get_t_number (
                          p_values => p_json_object,
                          p_path   => '[%d].y',
                          p0       => l_index
                          );

    select min(column_value), max(column_value)
    into l_current_minx, l_current_maxx
    from table(l_x_stroke_array);

    select min(column_value), max(column_value)
    into l_current_miny, l_current_maxy
    from table(l_y_stroke_array);

    if l_current_minx < l_overall_minx then
      l_overall_minx := l_current_minx;
    end if;  

    if l_current_miny < l_overall_miny then
      l_overall_miny := l_current_miny;
    end if;  

    if l_current_maxx > l_overall_maxx then
      l_overall_maxx := l_current_maxx;
    end if;  

    if l_current_maxy > l_overall_maxy then
      l_overall_maxy := l_current_maxy;
    end if;  

  end loop;

  l_overall_minx := l_overall_minx - l_padding;
  l_overall_miny := l_overall_miny - l_padding;
  l_overall_maxx := l_overall_maxx + l_padding;
  l_overall_maxy := l_overall_maxy + l_padding;

  p_sizex := l_overall_maxx - l_overall_minx;
	p_sizey := l_overall_maxy - l_overall_miny;

  -- Fix if minimum X or Y is less than zero
  if l_overall_minx < 0 then 
    l_overall_minx := 0;
  end if;

  if l_overall_miny < 0 then 
    l_overall_miny := 0;
  end if;
  
  p_minx := l_overall_minx;
  p_miny := l_overall_miny;

end calculate_dimensions;

/*******************************************************************************
*    Name: base30_to_svg
* Purpose: Convert jSignature base30 encoded string to SVG graphic format
*******************************************************************************/
function base30_to_svg (
  p_base30_string                 varchar2
) return clob is
  l_return_clob                   clob;
  l_result_json                   clob;
  l_json_object                   apex_json.t_values;
  l_svg_array                     apex_t_varchar2 := apex_t_varchar2();
  l_array_size                    number;
  l_index                         number;  
  l_x_stroke_array                apex_t_number;
  l_y_stroke_array                apex_t_number;

  l_sizex                         number := 0;
  l_sizey                         number := 0;
  l_minx                          number := 0;
  l_miny                          number := 0;
  
begin

  if p_base30_string is null or p_base30_string = '' then
    return null;
  end if;  

  l_result_json := jsignature_pkg.base30_to_json(p_base30_string);

  -- Parse the JSON, determine how many array entries
  apex_json.parse(l_json_object, l_result_json);
  l_array_size := apex_json.get_count(p_path => '.', p_values => l_json_object);  

  -- Start the svg 
  l_svg_array.extend;
  l_svg_array(l_svg_array.last) := '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';

  l_svg_array.extend;
  l_svg_array(l_svg_array.last) := '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

  -- Determine dimensions for the svg 
  jsignature_pkg.calculate_dimensions (
    p_json_object => l_json_object,
    p_sizex       => l_sizex,
    p_sizey       => l_sizey,
    p_minx        => l_minx,
    p_miny        => l_miny
    );

  -- Write out size information to SVG array
  l_svg_array.extend;
  l_svg_array(l_svg_array.last) := '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' || l_sizex || '" height="' || l_sizey || '">';

  -- Write out the strokes
  for l_index in 1 .. l_array_size loop

    l_x_stroke_array := apex_json.get_t_number (
                          p_values => l_json_object,
                          p_path   => '[%d].x',
                          p0       => l_index
                          );

    l_y_stroke_array := apex_json.get_t_number (
                          p_values => l_json_object,
                          p_path   => '[%d].y',
                          p0       => l_index
                          );
  
    -- Write out the SVG path element for this stroke
    l_svg_array.extend;
    l_svg_array(l_svg_array.last) := jsignature_pkg.generate_stroke_path (
                                       p_x_stroke_array => l_x_stroke_array,
                                       p_y_stroke_array => l_y_stroke_array,
                                       p_minx           => l_minx,
                                       p_miny           => l_miny
                                       );
  
  end loop;

  -- Finish off the SVG
  l_svg_array.extend;
  l_svg_array(l_svg_array.last) := '</svg>';

  -- Convert array back to concatenated lines of text
  l_return_clob := apex_string.join_clob(l_svg_array);

  return l_return_clob;

end base30_to_svg;

end jsignature_pkg;
/
