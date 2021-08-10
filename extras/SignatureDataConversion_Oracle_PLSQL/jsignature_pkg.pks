create or replace package jsignature_pkg as

  -- Globals
  gc_chunk_separator              varchar2(1) := '_';
  gc_minus                        varchar2(1) := 'Z';
  gc_plus                         varchar2(1) := 'Y';
  gc_current_debug_level          number := 0; 
  gc_debug_basic                  number := 1; 
  gc_debug_detailed               number := 10; 

  type gt_charmap is table of varchar2(1) index by varchar2(1);

  gc_charmap                      gt_charmap;
  gc_charmap_reverse              gt_charmap;
  gc_bitness                      number;
  
-- Function / Variable declarations
function string_to_array (
  p_string                        varchar2
) return apex_t_varchar2;

function intval (
  p_value                         varchar2,
  p_from_base                     number
) return number;

procedure initialise_globals;

function uncompress_stroke_leg (
  p_stroke_data_string            varchar2
) return apex_t_number;

function base30_to_json (
  p_base30_string                 varchar2
) return clob;

function base30_to_svg (
  p_base30_string                 varchar2
) return clob;

end jsignature_pkg;
/